#!/bin/sh

echo "Loading sample data into Elasticsearch..."

# Sample products data - 100 products
echo "Creating sample-products index with 100 products..."

# Create temporary file for bulk data
bulk_file="/tmp/bulk_products.json"
> "$bulk_file"

# Generate 100 products using a simple approach
i=1
while [ $i -le 100 ]; do
    # Simple rotation through categories and brands
    case $((i % 12)) in
        0) category="laptops" ;;
        1) category="smartphones" ;;
        2) category="headphones" ;;
        3) category="tablets" ;;
        4) category="accessories" ;;
        5) category="monitors" ;;
        6) category="storage" ;;
        7) category="wearables" ;;
        8) category="speakers" ;;
        9) category="furniture" ;;
        10) category="drones" ;;
        11) category="gaming" ;;
    esac
    
    case $((i % 15)) in
        0) brand="Apple" ;;
        1) brand="Dell" ;;
        2) brand="Samsung" ;;
        3) brand="Sony" ;;
        4) brand="Microsoft" ;;
        5) brand="Logitech" ;;
        6) brand="Anker" ;;
        7) brand="JBL" ;;
        8) brand="Corsair" ;;
        9) brand="Razer" ;;
        10) brand="LG" ;;
        11) brand="HP" ;;
        12) brand="Lenovo" ;;
        13) brand="Asus" ;;
        14) brand="Acer" ;;
    esac
    
    case $((i % 20)) in
        0) base_name="MacBook Pro" ;;
        1) base_name="iPhone" ;;
        2) base_name="Galaxy S" ;;
        3) base_name="XPS" ;;
        4) base_name="Surface Pro" ;;
        5) base_name="iPad" ;;
        6) base_name="AirPods" ;;
        7) base_name="WH-1000XM" ;;
        8) base_name="Gaming Mouse" ;;
        9) base_name="Mechanical Keyboard" ;;
        10) base_name="Monitor 4K" ;;
        11) base_name="SSD External" ;;
        12) base_name="Smart Watch" ;;
        13) base_name="Bluetooth Speaker" ;;
        14) base_name="Webcam HD" ;;
        15) base_name="USB-C Hub" ;;
        16) base_name="Power Bank" ;;
        17) base_name="Wireless Charger" ;;
        18) base_name="Gaming Chair" ;;
        19) base_name="Drone Camera" ;;
    esac
    
    # Generate semi-random values using process ID and counter
    price_base=$((i * 37 + 123))
    price=$((price_base % 1950 + 50))
    stock=$((i * 23 % 100 + 1))
    rating_int=$((i * 17 % 25 + 35))
    rating="${rating_int%?}.${rating_int#?}"
    day=$((i % 28 + 1))
    month=$((i % 2 + 1))
    
    # Write to bulk file with proper newlines
    echo '{"index":{"_id":"'$i'"}}' >> "$bulk_file"
    echo '{"name":"'$base_name' '$i'","description":"High-quality '$base_name' model '$i' with premium features","category":"'$category'","price":'$price',"stock":'$stock',"brand":"'$brand'","rating":'$rating',"created_date":"2024-0'$month'-'$(printf "%02d" $day)'","tags":["'$category'","premium"],"is_active":true}' >> "$bulk_file"
    
    i=$((i + 1))
done

curl -X POST 'elasticsearch:9200/sample-products/_bulk' -H 'Content-Type: application/json' --data-binary @"$bulk_file"

echo "Sample products loaded successfully!"

# Create user-logs index with 100 entries
echo "Creating user-logs index with 100 entries..."

curl -X PUT 'elasticsearch:9200/user-logs' -H 'Content-Type: application/json' -d '{
  "mappings": {
    "properties": {
      "user_id": { "type": "keyword" },
      "action": { "type": "keyword" },
      "timestamp": { "type": "date" },
      "ip_address": { "type": "ip" },
      "user_agent": { "type": "text" },
      "session_id": { "type": "keyword" }
    }
  }
}'

# Create temporary file for user logs bulk data
bulk_logs_file="/tmp/bulk_logs.json"
> "$bulk_logs_file"

# Generate 100 user log entries
i=1
while [ $i -le 100 ]; do
    user_num=$((i % 50 + 1))
    user_id="user_$(printf "%03d" $user_num)"
    
    case $((i % 8)) in
        0) action="login" ;;
        1) action="logout" ;;
        2) action="search" ;;
        3) action="purchase" ;;
        4) action="view" ;;
        5) action="add_to_cart" ;;
        6) action="remove_from_cart" ;;
        7) action="checkout" ;;
    esac
    
    case $((i % 4)) in
        0) user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" ;;
        1) user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)" ;;
        2) user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" ;;
        3) user_agent="Mozilla/5.0 (X11; Linux x86_64)" ;;
    esac
    
    hour=$((i * 13 % 24))
    minute=$((i * 7 % 60))
    day=$((i % 28 + 1))
    
    ip_a=$((i % 256))
    ip_b=$((i * 3 % 256))
    ip_c=$((i * 5 % 256))
    ip_d=$((i * 7 % 256))
    
    session_num=$((i * 1000 + 123456))
    session_id="sess_$(printf "%06d" $session_num)"
    
    # Write to bulk file with proper newlines
    echo '{"index":{"_id":"'$i'"}}' >> "$bulk_logs_file"
    echo '{"user_id":"'$user_id'","action":"'$action'","timestamp":"2024-02-'$(printf "%02d" $day)'T'$(printf "%02d" $hour)':'$(printf "%02d" $minute)':00Z","ip_address":"'$ip_a'.'$ip_b'.'$ip_c'.'$ip_d'","user_agent":"'$user_agent'","session_id":"'$session_id'"}' >> "$bulk_logs_file"
    
    i=$((i + 1))
done

curl -X POST 'elasticsearch:9200/user-logs/_bulk' -H 'Content-Type: application/json' --data-binary @"$bulk_logs_file"

echo "User logs loaded successfully!"

# Create system-metrics index with 100 entries
echo "Creating system-metrics index with 100 entries..."

curl -X PUT 'elasticsearch:9200/system-metrics' -H 'Content-Type: application/json' -d '{
  "mappings": {
    "properties": {
      "hostname": { "type": "keyword" },
      "cpu_usage": { "type": "float" },
      "memory_usage": { "type": "float" },
      "disk_usage": { "type": "float" },
      "network_in": { "type": "long" },
      "network_out": { "type": "long" },
      "timestamp": { "type": "date" }
    }
  }
}'

# Create temporary file for system metrics bulk data
bulk_metrics_file="/tmp/bulk_metrics.json"
> "$bulk_metrics_file"

# Generate 100 system metrics entries
i=1
while [ $i -le 100 ]; do
    case $((i % 8)) in
        0) hostname="web-server-01" ;;
        1) hostname="web-server-02" ;;
        2) hostname="web-server-03" ;;
        3) hostname="db-server-01" ;;
        4) hostname="db-server-02" ;;
        5) hostname="cache-server-01" ;;
        6) hostname="api-server-01" ;;
        7) hostname="api-server-02" ;;
    esac
    
    cpu_base=$((i * 37 + 50))
    cpu_usage=$((cpu_base % 85 + 5))
    memory_base=$((i * 41 + 100))
    memory_usage=$((memory_base % 75 + 10))
    disk_base=$((i * 29 + 150))
    disk_usage=$((disk_base % 55 + 15))
    network_in=$((i * 50000 + 500000))
    network_out=$((i * 45000 + 600000))
    
    hour=$((i * 11 % 24))
    minute=$((i * 13 % 60))
    day=$((i % 28 + 1))
    
    # Write to bulk file with proper newlines
    echo '{"index":{"_id":"'$i'"}}' >> "$bulk_metrics_file"
    echo '{"hostname":"'$hostname'","cpu_usage":'$cpu_usage',"memory_usage":'$memory_usage',"disk_usage":'$disk_usage',"network_in":'$network_in',"network_out":'$network_out',"timestamp":"2024-02-'$(printf "%02d" $day)'T'$(printf "%02d" $hour)':'$(printf "%02d" $minute)':00Z"}' >> "$bulk_metrics_file"
    
    i=$((i + 1))
done

curl -X POST 'elasticsearch:9200/system-metrics/_bulk' -H 'Content-Type: application/json' --data-binary @"$bulk_metrics_file"

echo "System metrics loaded successfully!"

# Clean up temporary files
rm -f "$bulk_file" "$bulk_logs_file" "$bulk_metrics_file"

echo "All sample indices created and populated successfully!"
echo "Available indices:"
echo "- sample-products: E-commerce product catalog with 100 items"
echo "- user-logs: User activity logs with 100 entries"
echo "- system-metrics: Server monitoring data with 100 entries"
echo ""
echo "You can now test searches like:"
echo "curl 'http://elasticsearch:9200/sample-products/_search?q=apple'"
echo "curl 'http://elasticsearch:9200/user-logs/_search?q=login'"
echo "curl 'http://elasticsearch:9200/system-metrics/_search?q=hostname:web-server-01'"