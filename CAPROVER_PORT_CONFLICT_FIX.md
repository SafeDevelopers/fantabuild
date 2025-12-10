# Fix Port 80/443/3000 Already in Use Error

This error occurs when another service is already using the ports that CapRover needs (80, 443, or 3000).

## Quick Fix

### Step 1: Check What's Using the Ports

```bash
# Check port 80
sudo lsof -i :80
# or
sudo netstat -tulpn | grep :80

# Check port 443
sudo lsof -i :443
# or
sudo netstat -tulpn | grep :443

# Check port 3000
sudo lsof -i :3000
# or
sudo netstat -tulpn | grep :3000
```

### Step 2: Stop the Conflicting Service

**If Apache is running:**
```bash
# Stop Apache
sudo systemctl stop apache2
# or
sudo service apache2 stop

# Disable Apache from starting on boot
sudo systemctl disable apache2
```

**If Nginx is running:**
```bash
# Stop Nginx
sudo systemctl stop nginx
# or
sudo service nginx stop

# Disable Nginx from starting on boot
sudo systemctl disable nginx
```

**If another Docker container is using the port:**
```bash
# List running containers
docker ps

# Stop the container using the port
docker stop CONTAINER_NAME_OR_ID

# Remove the container (if not needed)
docker rm CONTAINER_NAME_OR_ID
```

**If another service is using the port:**
```bash
# Find the process ID (PID) from lsof/netstat output
# Then kill it:
sudo kill -9 PID_NUMBER
```

### Step 3: Verify Ports are Free

```bash
# Check all three ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Should return nothing (ports are free)
```

### Step 4: Retry CapRover Installation

```bash
docker run -p 80:80 -p 443:443 -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover
```

---

## Alternative: Use Different Ports (Not Recommended)

If you absolutely need to keep the existing service running, you can run CapRover on different ports:

```bash
# Use ports 8080, 8443, 3001 instead
docker run -p 8080:80 -p 8443:443 -p 3001:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover
```

**Note:** This is not recommended as it requires additional configuration and CapRover works best on standard ports.

---

## Common Services Using Port 80

### Apache (httpd)

```bash
# Check if Apache is installed
which apache2
# or
which httpd

# Stop and disable
sudo systemctl stop apache2
sudo systemctl disable apache2

# Or remove completely (if not needed)
sudo apt remove apache2 -y
```

### Nginx

```bash
# Check if Nginx is installed
which nginx

# Stop and disable
sudo systemctl stop nginx
sudo systemctl disable nginx

# Or remove completely (if not needed)
sudo apt remove nginx -y
```

### Other Web Servers

```bash
# Check for other web servers
sudo systemctl list-units --type=service | grep -E 'http|web|server'

# Stop any you find
sudo systemctl stop SERVICE_NAME
sudo systemctl disable SERVICE_NAME
```

---

## Complete Cleanup Script

Run this to check and stop common services:

```bash
#!/bin/bash

echo "Checking for services using ports 80, 443, 3000..."

# Check port 80
echo "Port 80:"
sudo lsof -i :80 || echo "Port 80 is free"

# Check port 443
echo "Port 443:"
sudo lsof -i :443 || echo "Port 443 is free"

# Check port 3000
echo "Port 3000:"
sudo lsof -i :3000 || echo "Port 3000 is free"

# Stop Apache if running
if systemctl is-active --quiet apache2; then
    echo "Stopping Apache..."
    sudo systemctl stop apache2
    sudo systemctl disable apache2
fi

# Stop Nginx if running
if systemctl is-active --quiet nginx; then
    echo "Stopping Nginx..."
    sudo systemctl stop nginx
    sudo systemctl disable nginx
fi

# Stop any Docker containers using these ports
echo "Checking Docker containers..."
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "80|443|3000"

echo "Done! Ports should now be free."
```

Save as `fix-ports.sh`, make executable, and run:
```bash
chmod +x fix-ports.sh
sudo ./fix-ports.sh
```

---

## Verify After Fix

```bash
# All should return empty (ports free)
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Then install CapRover
docker run -p 80:80 -p 443:443 -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover
```

---

## Troubleshooting

### Port Still in Use After Stopping Service

```bash
# Find the exact process
sudo fuser -v 80/tcp
sudo fuser -v 443/tcp
sudo fuser -v 3000/tcp

# Kill the process
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
sudo fuser -k 3000/tcp
```

### Docker Container Won't Stop

```bash
# Force stop
docker stop -t 0 CONTAINER_NAME

# Force remove
docker rm -f CONTAINER_NAME
```

### Service Keeps Restarting

```bash
# Disable the service first
sudo systemctl disable SERVICE_NAME

# Then stop it
sudo systemctl stop SERVICE_NAME

# Check if it's still running
sudo systemctl status SERVICE_NAME
```

---

## Prevention

After installing CapRover, make sure other services don't start automatically:

```bash
# List all enabled services
systemctl list-unit-files --type=service --state=enabled | grep -E 'http|web|nginx|apache'

# Disable any you don't need
sudo systemctl disable SERVICE_NAME
```

---

## Quick Reference

```bash
# Check what's using a port
sudo lsof -i :PORT_NUMBER

# Stop a service
sudo systemctl stop SERVICE_NAME
sudo systemctl disable SERVICE_NAME

# Stop a Docker container
docker stop CONTAINER_NAME

# Kill a process by PID
sudo kill -9 PID_NUMBER

# Verify port is free
sudo lsof -i :PORT_NUMBER
# Should return nothing
```
