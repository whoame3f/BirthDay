import http.server
import socketserver
import json
import urllib.parse
import os

PORT = 8080

MOCK_DATABASE = {
    "order": "Special Birthday Gift 🎁",
    "courier": "Shopee Xpress (SPX Premium)",
    "trackingNumber": "SPX9284719283ID",
    "estimatedDelivery": "2026-09-01T18:30:00Z",
    "lastUpdate": "2026-09-01 10:30 WIB",
    "secretMessage": "A magical handcrafted surprise full of warmth and sweet memories!",
    "timeline": [
        {
            "id": "ORDER_PLACED",
            "title": "Order Placed",
            "subtitle": "Your gift has started its journey.",
            "location": "Jakarta Store",
            "timestamp": "2026-08-31 09:00 WIB",
            "icon": "📦",
            "completed": True
        },
        {
            "id": "SELLER_PREPARING",
            "title": "Seller Preparing",
            "subtitle": "The birthday surprise is being prepared with special care...",
            "location": "Seller Workshop",
            "timestamp": "2026-08-31 14:15 WIB",
            "icon": "🏪",
            "completed": True
        },
        {
            "id": "PACKAGE_PICKED_UP",
            "title": "Package Picked Up",
            "subtitle": "Your gift has officially started traveling.",
            "location": "Central Logistics Depot",
            "timestamp": "2026-08-31 18:45 WIB",
            "icon": "🚚",
            "completed": True
        },
        {
            "id": "SORTING_CENTER",
            "title": "Sorting Center",
            "subtitle": "Your gift is getting closer...",
            "location": "Jakarta Hub Transit Center",
            "timestamp": "2026-09-01 04:20 WIB",
            "icon": "📍",
            "completed": True
        },
        {
            "id": "OUT_FOR_DELIVERY",
            "title": "Out for Delivery",
            "subtitle": "It's almost there! Courier is on the way to your door.",
            "location": "Local Express Station",
            "timestamp": "2026-09-01 10:30 WIB",
            "icon": "🛵",
            "completed": False
        },
        {
            "id": "DELIVERED",
            "title": "Delivered",
            "subtitle": "The surprise has arrived!",
            "location": "Your Home",
            "timestamp": "2026-09-01 --:--",
            "icon": "🎁",
            "completed": False
        }
    ]
}

current_simulated_status = "OUT_FOR_DELIVERY"
simulate_error = False

class TrackingRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        # Handle favicon request cleanly without 404
        if path == '/favicon.ico':
            self.send_response(200)
            self.send_header('Content-Type', 'image/x-icon')
            self.end_headers()
            self.wfile.write(b'')
            return

        # REST API endpoint /api/tracking
        if path.startswith('/api/tracking'):
            global current_simulated_status, simulate_error

            if 'status' in query:
                req_status = query['status'][0].upper()
                valid_ids = [t['id'] for t in MOCK_DATABASE['timeline']]
                if req_status in valid_ids:
                    current_simulated_status = req_status
                    simulate_error = False
            
            if 'force_error' in query:
                simulate_error = (query['force_error'][0].lower() == 'true')

            if simulate_error:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                err_resp = {"error": "Tracking service temporarily unavailable", "code": 500}
                self.wfile.write(json.dumps(err_resp).encode('utf-8'))
                return

            response_data = json.loads(json.dumps(MOCK_DATABASE))
            response_data['status'] = current_simulated_status

            status_index = 0
            for idx, item in enumerate(response_data['timeline']):
                if item['id'] == current_simulated_status:
                    status_index = idx
                    break

            for idx, item in enumerate(response_data['timeline']):
                if idx < status_index:
                    item['completed'] = True
                elif idx == status_index:
                    item['completed'] = True
                    item['active'] = True
                    if item['id'] == 'DELIVERED':
                        item['timestamp'] = "2026-09-01 13:00 WIB"
                        response_data['lastUpdate'] = "2026-09-01 13:00 WIB"
                else:
                    item['completed'] = False
                    item['active'] = False

            response_data['currentLocation'] = response_data['timeline'][status_index]['location']

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            return

        return super().do_GET()

def run_server():
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), TrackingRequestHandler) as httpd:
        print(f"Server starting on http://localhost:{PORT}...")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    run_server()
