from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import urllib.request
import ssl
import time

# Default fallback mock database if tracking number is not found or live request fails
MOCK_DATABASE = {
    "order": "Special Birthday Gift 🎁",
    "courier": "Shopee Xpress (SPX Express)",
    "trackingNumber": "SPXID065232769239",
    "estimatedDelivery": "2026-09-06T18:30:00Z",
    "lastUpdate": "2026-09-06 00:17 WIB",
    "secretMessage": "A magical handcrafted surprise full of warmth and sweet memories!",
    "timeline": [
        {
            "id": "ORDER_PLACED",
            "title": "Pengirim Mengatur Pengiriman",
            "subtitle": "Pengirim telah mengatur pengiriman. Menunggu pesanan diserahkan ke jasa kirim.",
            "location": "Kalideres 2, Jakarta Barat",
            "timestamp": "2026-09-05 17:01 WIB",
            "icon": "📦",
            "completed": True
        },
        {
            "id": "SELLER_PREPARING",
            "title": "Pesanan Diterima Service Point",
            "subtitle": "Pesanan diterima oleh Agen SPX Express Service Point Kalideres 2.",
            "location": "Kalideres 2 Service Point",
            "timestamp": "2026-09-05 17:22 WIB",
            "icon": "🏪",
            "completed": True
        },
        {
            "id": "PACKAGE_PICKED_UP",
            "title": "Pesanan Diserahkan Ke Jasa Kirim",
            "subtitle": "Pesanan dikirim dari lokasi transit Kalideres 9 First Mile Hub.",
            "location": "Kalideres First Mile Hub",
            "timestamp": "2026-09-05 21:01 WIB",
            "icon": "🚚",
            "completed": True
        },
        {
            "id": "SORTING_CENTER",
            "title": "Transit Point Kalideres DC",
            "subtitle": "Pesanan disortir dan dikirim dari Kalideres DC ke Cakung 2 DC.",
            "location": "Kalideres Transit Point DC",
            "timestamp": "2026-09-05 21:53 WIB",
            "icon": "📍",
            "completed": True
        },
        {
            "id": "OUT_FOR_DELIVERY",
            "title": "Diproses di Lokasi Sortir Cakung",
            "subtitle": "Pesanan diproses di lokasi sortir Cakung 2 DC, Jakarta Timur.",
            "location": "Cakung 2 DC, Jakarta Timur",
            "timestamp": "2026-09-06 00:17 WIB",
            "icon": "🛵",
            "completed": True,
            "active": True
        },
        {
            "id": "DELIVERED",
            "title": "Tiba di Alamat Tujuan",
            "subtitle": "Hadiah kejutan ulang tahun sampai di tanganmu dengan selamat! ❤️",
            "location": "Alamat Tujuan",
            "timestamp": "2026-09-06 --:--",
            "icon": "🎁",
            "completed": False
        }
    ],
    "status": "OUT_FOR_DELIVERY",
    "currentLocation": "Cakung 2 DC, Jakarta Timur"
}

def fetch_spx_tracking(tracking_number):
    """
    Fetch live tracking data from public SPX web API
    """
    spx_url = f"https://spx.co.id/m/api/v2/fleet_order/tracking/search?sls_tracking_number={urllib.parse.quote(tracking_number)}"
    
    req = urllib.request.Request(
        spx_url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://spx.co.id/"
        }
    )

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, timeout=5, context=ctx) as resp:
            if resp.status == 200:
                body = resp.read().decode('utf-8')
                data = json.loads(body)
                if data.get('retcode') == 0 and data.get('data') and data['data'].get('tracks'):
                    return data['data']
    except Exception as e:
        print(f"Error querying SPX web API: {e}")

    return None

def format_spx_response(spx_data, tracking_number):
    """
    Convert raw SPX response into project's standard timeline format
    """
    tracks = spx_data.get('tracks', [])
    if not tracks:
        return MOCK_DATABASE

    formatted_timeline = []
    latest_desc = ""
    latest_time = ""
    is_delivered = False

    for idx, track in enumerate(tracks):
        desc = track.get('description', '')
        ctime = track.get('ctime') or track.get('timestamp') or time.time()
        
        # Convert unix timestamp to readable WIB time string
        time_str = time.strftime("%Y-%m-%d %H:%M WIB", time.localtime(ctime))
        
        icon = "📍"
        id_tag = f"STEP_{idx}"
        
        desc_lower = desc.lower()
        if "order" in desc_lower or "placed" in desc_lower or "dibuat" in desc_lower:
            icon = "📦"
            id_tag = "ORDER_PLACED"
        elif "pick" in desc_lower or "diambil" in desc_lower or "seller" in desc_lower:
            icon = "🏪"
            id_tag = "SELLER_PREPARING"
        elif "transit" in desc_lower or "hub" in desc_lower or "sorting" in desc_lower:
            icon = "🚚"
            id_tag = "SORTING_CENTER"
        elif "delivery" in desc_lower or "kurir" in desc_lower or "dikirim" in desc_lower:
            icon = "🛵"
            id_tag = "OUT_FOR_DELIVERY"
        elif "delivered" in desc_lower or "selesai" in desc_lower or "diterima" in desc_lower:
            icon = "🎁"
            id_tag = "DELIVERED"
            is_delivered = True

        formatted_timeline.append({
            "id": id_tag,
            "title": desc[:30] + ("..." if len(desc) > 30 else ""),
            "subtitle": desc,
            "location": "SPX Transit Node",
            "timestamp": time_str,
            "icon": icon,
            "completed": True
        })

        if idx == 0:
            latest_desc = desc
            latest_time = time_str

    current_status = "DELIVERED" if is_delivered else "OUT_FOR_DELIVERY"

    return {
        "order": "Special Birthday Gift 🎁",
        "courier": "Shopee Xpress (SPX Live)",
        "trackingNumber": tracking_number,
        "estimatedDelivery": latest_time,
        "lastUpdate": latest_time,
        "secretMessage": "A magical handcrafted surprise full of warmth and sweet memories!",
        "timeline": formatted_timeline,
        "status": current_status,
        "currentLocation": latest_desc
    }

class handler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed_url.query)

        tracking_num = None
        if 'trackingNumber' in query:
            tracking_num = query['trackingNumber'][0]
        elif 'sls_tracking_number' in query:
            tracking_num = query['sls_tracking_number'][0]
        elif 'spx_id' in query:
            tracking_num = query['spx_id'][0]

        result_data = None
        if tracking_num:
            spx_raw = fetch_spx_tracking(tracking_num)
            if spx_raw:
                result_data = format_spx_response(spx_raw, tracking_num)

        if not result_data:
            result_data = json.loads(json.dumps(MOCK_DATABASE))
            if tracking_num:
                result_data['trackingNumber'] = tracking_num

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result_data, ensure_ascii=False).encode('utf-8'))
        return
