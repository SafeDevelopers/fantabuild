# CapRover Clean Start Guide

This guide helps you completely clean up existing CapRover/Docker installations and start fresh.

## Complete Cleanup Script

Run these commands in order to clean everything:

### Step 1: Stop All Docker Containers

```bash
# Stop all running containers
docker stop $(docker ps -aq)

# If that doesn't work, force stop
docker stop $(docker ps -aq) 2>/dev/null || true
```

### Step 2: Remove All Docker Containers

```bash
# Remove all containers
docker rm $(docker ps -aq)

# Force remove if needed
docker rm -f $(docker ps -aq) 2>/dev/null || true
```

### Step 3: Check What's Using Port 80

```bash
# Check port 80 specifically
sudo netstat -tulpn | grep :80
# or
sudo ss -tulpn | grep :80

# Check Docker containers
docker ps -a | grep -E "80|443|3000"
```

### Step 4: Remove CapRover Container (if exists)

```bash
# Find CapRover container
docker ps -a | grep captain

# Stop and remove it
docker stop captain-captain 2>/dev/null || true
docker rm captain-captain 2>/dev/null || true

# Remove all containers with "captain" in name
docker ps -a | grep captain | awk '{print $1}' | xargs docker rm -f 2>/dev/null || true
```

### Step 5: Clean Up Docker Resources

```bash
# Remove all stopped containers
docker container prune -f

# Remove unused networks
docker network prune -f

# Remove unused volumes (CAREFUL - this removes data!)
# docker volume prune -f

# Remove unused images (optional)
# docker image prune -a -f
```

### Step 6: Verify Ports are Free

```bash
# Check all three ports
echo "Checking port 80:"
sudo netstat -tulpn | grep :80 || echo "Port 80 is free"

echo "Checking port 443:"
sudo netstat -tulpn | grep :443 || echo "Port 443 is free"

echo "Checking port 3000:"
sudo netstat -tulpn | grep :3000 || echo "Port 3000 is free"
```

### Step 7: Check for Other Services

```bash
# Check Apache
systemctl status apache2 2>/dev/null | grep Active || echo "Apache not running"

# Check Nginx
systemctl status nginx 2>/dev/null | grep Active || echo "Nginx not running"

# Stop them if running
sudo systemctl stop apache2 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl disable apache2 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true
```

### Step 8: Clean CapRover Data (Optional - Only if you want to start completely fresh)

```bash
# Remove CapRover data directory
sudo rm -rf /captain

# Remove CapRover Docker volumes
docker volume ls | grep captain | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true
```

### Step 9: Restart Docker (Optional)

```bash
# Restart Docker service
sudo systemctl restart docker

# Verify Docker is running
sudo systemctl status docker
```

### Step 10: Fresh CapRover Installation

```bash
# Now install CapRover fresh
docker run -p 80:80 -p 443:443 -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover
```

---

## One-Command Complete Cleanup

Run this single command to clean everything:

```bash
# Complete cleanup script
docker stop $(docker ps -aq) 2>/dev/null || true && \
docker rm -f $(docker ps -aq) 2>/dev/null || true && \
docker container prune -f && \
docker network prune -f && \
sudo systemctl stop apache2 nginx 2>/dev/null || true && \
sudo systemctl disable apache2 nginx 2>/dev/null || true && \
echo "Cleanup complete! Ports should be free now."
```

Then verify:
```bash
sudo netstat -tulpn | grep -E ":80|:443|:3000"
```

Should return nothing (ports are free).

---

## Step-by-Step Manual Cleanup

If the one-command script doesn't work, do it manually:

### 1. List All Containers

```bash
docker ps -a
```

### 2. Stop Specific Container Using Port 80

```bash
# Find container using port 80
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 80

# Stop it by name
docker stop CONTAINER_NAME

# Or by ID
docker stop CONTAINER_ID
```

### 3. Remove the Container

```bash
docker rm CONTAINER_NAME
# or
docker rm -f CONTAINER_NAME  # Force remove
```

### 4. Check Port Again

```bash
sudo netstat -tulpn | grep :80
```

### 5. If Still in Use, Find the Process

```bash
# Find process using port 80
sudo fuser -v 80/tcp

# Kill it
sudo fuser -k 80/tcp
```

---

## Nuclear Option: Complete Docker Reset

If nothing else works, completely reset Docker (WARNING: This removes ALL Docker data):

```bash
# Stop Docker
sudo systemctl stop docker

# Remove all containers, networks, volumes
sudo rm -rf /var/lib/docker/containers
sudo rm -rf /var/lib/docker/networks
# sudo rm -rf /var/lib/docker/volumes  # Only if you want to remove volumes

# Start Docker
sudo systemctl start docker

# Verify
docker ps
```

---

## Verify Everything is Clean

Run this verification script:

```bash
#!/bin/bash

echo "=== Docker Containers ==="
docker ps -a
echo ""

echo "=== Port 80 ==="
sudo netstat -tulpn | grep :80 || echo "Port 80 is free"
echo ""

echo "=== Port 443 ==="
sudo netstat -tulpn | grep :443 || echo "Port 443 is free"
echo ""

echo "=== Port 3000 ==="
sudo netstat -tulpn | grep :3000 || echo "Port 3000 is free"
echo ""

echo "=== Apache Status ==="
systemctl status apache2 2>/dev/null | grep Active || echo "Apache not running"
echo ""

echo "=== Nginx Status ==="
systemctl status nginx 2>/dev/null | grep Active || echo "Nginx not running"
echo ""

echo "=== Docker Status ==="
systemctl status docker | grep Active
```

Save as `check-clean.sh`, make executable, and run:
```bash
chmod +x check-clean.sh
sudo ./check-clean.sh
```

---

## After Cleanup: Fresh CapRover Install

Once everything is clean:

```bash
# 1. Verify ports are free
sudo netstat -tulpn | grep -E ":80|:443|:3000"
# Should return nothing

# 2. Install CapRover
docker run -d -p 80:80 -p 443:443 -p 3000:3000 \
    --name captain-captain \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover

# 3. Check it's running
docker ps | grep captain

# 4. Check logs
docker logs captain-captain
```

---

## Troubleshooting

### Port Still in Use After Cleanup

```bash
# Find the exact process
sudo fuser -v 80/tcp
sudo fuser -v 443/tcp
sudo fuser -v 3000/tcp

# Kill all processes on these ports
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
sudo fuser -k 3000/tcp
```

### Docker Container Won't Remove

```bash
# Force remove
docker rm -f CONTAINER_NAME

# If that doesn't work, stop Docker and remove manually
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/containers/CONTAINER_ID
sudo systemctl start docker
```

### CapRover Data Persists

```bash
# Remove CapRover data
sudo rm -rf /captain

# Remove CapRover volumes
docker volume ls | grep captain
docker volume rm VOLUME_NAME
```

---

## Quick Reference Commands

```bash
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm -f $(docker ps -aq)

# Check ports
sudo netstat -tulpn | grep -E ":80|:443|:3000"

# Clean Docker
docker system prune -a -f

# Restart Docker
sudo systemctl restart docker

# Install CapRover
docker run -d -p 80:80 -p 443:443 -p 3000:3000 \
    --name captain-captain \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover
```
