# CapRover Initial Setup Guide

This guide walks you through setting up CapRover from scratch on a fresh VPS, including SSH setup, Docker installation, and CapRover installation.

## Prerequisites

- A VPS (Virtual Private Server) - Contabo, DigitalOcean, AWS, etc.
- Root or sudo access to the server
- A domain name (optional but recommended)
- Basic knowledge of Linux commands

---

## Step 1: Connect to Your VPS via SSH

### 1.1 Get Your Server Credentials

From your VPS provider, you should have:
- **Server IP Address** (e.g., `123.45.67.89`)
- **Root Password** or **SSH Key**
- **Username** (usually `root` for new servers)

### 1.2 Connect via SSH

**On Mac/Linux:**
```bash
ssh root@YOUR_SERVER_IP
```

**On Windows:**
- Use **PuTTY** or **Windows Terminal**
- Or use **WSL** (Windows Subsystem for Linux)
- Or use **Git Bash**

**Example:**
```bash
ssh root@123.45.67.89
```

**First time connection:**
- You'll see a security warning - type `yes` to continue
- Enter your root password when prompted

### 1.3 Secure SSH (Recommended)

After first login, set up SSH keys for passwordless login:

**On your local machine:**
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to server
ssh-copy-id root@YOUR_SERVER_IP
```

**Or manually:**
```bash
# On local machine
cat ~/.ssh/id_ed25519.pub

# Copy the output, then on server:
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Disable password authentication (optional but recommended):**
```bash
# On server
nano /etc/ssh/sshd_config

# Find and change:
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
systemctl restart sshd
```

---

## Step 2: Update System

Once connected, update your server:

```bash
# Update package list
apt update

# Upgrade existing packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git nano ufw
```

---

## Step 3: Install Docker

CapRover requires Docker to be installed. Follow these steps:

### 3.1 Remove Old Docker Versions (if any)

```bash
apt remove docker docker-engine docker.io containerd runc -y
```

### 3.2 Install Docker Dependencies

```bash
apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

### 3.3 Add Docker's Official GPG Key

```bash
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

### 3.4 Set Up Docker Repository

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 3.5 Install Docker Engine

```bash
# Update package list
apt update

# Install Docker Engine, CLI, and Containerd
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 3.6 Verify Docker Installation

```bash
# Check Docker version
docker --version

# Test Docker
docker run hello-world
```

**Expected output:**
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### 3.7 Start and Enable Docker

```bash
# Start Docker service
systemctl start docker

# Enable Docker to start on boot
systemctl enable docker

# Check Docker status
systemctl status docker
```

---

## Step 4: Install CapRover

### 4.1 Run CapRover Installation Script

```bash
docker run -p 80:80 -p 443:443 -p 3000:3000 -v /var/run/docker.sock:/var/run/docker.sock -v /captain:/captain caprover/caprover
```

**Or use the official installer:**

```bash
# Download and run CapRover installer
docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock caprover/caprover-installer
```

**Or use the automated script:**

```bash
# One-line installation
docker run -p 80:80 -p 443:443 -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain:/captain \
    -e ACCEPTED_TERMS_OF_SERVICE=true \
    caprover/caprover
```

### 4.2 Access CapRover Dashboard

1. **Open your browser** and go to:
   ```
   http://YOUR_SERVER_IP:3000
   ```
   Or if you have a domain:
   ```
   http://captain.yourdomain.com
   ```

2. **Set up admin password:**
   - Enter a strong password
   - Confirm password
   - Click "Set Password"

3. **You're now logged into CapRover!**

---

## Step 5: Configure Firewall (UFW)

Set up firewall rules to allow necessary ports:

```bash
# Enable UFW
ufw enable

# Allow SSH (IMPORTANT - do this first!)
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Allow CapRover dashboard
ufw allow 3000/tcp

# Check firewall status
ufw status
```

**Important:** Make sure to allow SSH (port 22) before enabling the firewall, or you'll be locked out!

---

## Step 6: Configure Domain (Optional but Recommended)

### 6.1 Point Domain to Your Server

In your domain's DNS settings, add an A record:

```
Type: A
Name: @ (or leave blank)
Value: YOUR_SERVER_IP
TTL: 3600 (or default)
```

For CapRover dashboard:
```
Type: A
Name: captain
Value: YOUR_SERVER_IP
TTL: 3600
```

### 6.2 Configure CapRover Domain

1. In CapRover dashboard, go to **"Settings"**
2. Click **"Domain Configuration"**
3. Enter your domain: `yourdomain.com`
4. Click **"Save & Update"**
5. Wait for DNS propagation (can take a few minutes to hours)

### 6.3 Access via Domain

After DNS propagates, you can access:
- CapRover Dashboard: `http://captain.yourdomain.com:3000`
- Apps will be accessible via: `http://app-name.yourdomain.com`

---

## Step 7: Install One-Click Apps (Optional)

CapRover includes one-click apps for databases:

### 7.1 Install PostgreSQL

1. In CapRover dashboard, go to **"Apps"**
2. Click **"One-Click Apps/Databases"**
3. Find **"PostgreSQL"**
4. Click **"Deploy"**
5. Set app name: `postgres` (or `fantabuild-db`)
6. Set password for `postgres` user
7. Click **"Deploy"**

**Note the service name** - you'll use it as `DB_HOST` (e.g., `postgres.captain.local`)

### 7.2 Install Redis

1. Same process as PostgreSQL
2. App name: `redis` (or `fantabuild-redis`)
3. No password needed by default
4. Service name: `redis.captain.local`

---

## Step 8: Verify Installation

### 8.1 Check Docker

```bash
docker ps
```

Should show CapRover container running.

### 8.2 Check CapRover

```bash
docker logs captain-captain --tail 50
```

Should show CapRover logs without errors.

### 8.3 Test CapRover Dashboard

- Go to `http://YOUR_SERVER_IP:3000`
- Should see CapRover login/dashboard
- Try logging in with your admin password

---

## Troubleshooting

### Can't Connect via SSH

**Check:**
- Is SSH service running? `systemctl status ssh`
- Is port 22 open in firewall? `ufw status`
- Is port 22 open in VPS provider's firewall?
- Check VPS provider's security groups/firewall rules

### Docker Installation Fails

**Try:**
```bash
# Check if Docker repository was added correctly
cat /etc/apt/sources.list.d/docker.list

# Remove and re-add repository
rm /etc/apt/sources.list.d/docker.list
# Then re-run installation steps
```

### CapRover Won't Start

**Check:**
```bash
# Check Docker is running
systemctl status docker

# Check CapRover container
docker ps -a | grep captain

# Check logs
docker logs captain-captain
```

### Port Already in Use

If port 80, 443, or 3000 is already in use:

```bash
# Check what's using the port
lsof -i :80
lsof -i :443
lsof -i :3000

# Stop the service or change CapRover ports
```

### Can't Access CapRover Dashboard

**Check:**
- Is port 3000 open in firewall? `ufw allow 3000/tcp`
- Is port 3000 open in VPS provider's firewall?
- Try accessing via IP: `http://YOUR_SERVER_IP:3000`
- Check CapRover is running: `docker ps | grep captain`

---

## Security Best Practices

### 1. Change Default SSH Port (Optional)

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change port (e.g., to 2222)
Port 2222

# Restart SSH
systemctl restart sshd

# Update firewall
ufw allow 2222/tcp
```

### 2. Disable Root Login (Recommended)

```bash
# Create a new user
adduser yourusername
usermod -aG sudo yourusername

# Edit SSH config
nano /etc/ssh/sshd_config

# Change:
PermitRootLogin no

# Restart SSH
systemctl restart sshd
```

### 3. Set Up Fail2Ban

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. Regular Updates

```bash
# Set up automatic security updates
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## Next Steps

After completing this setup:

1. ✅ CapRover is installed and accessible
2. ✅ Docker is installed and working
3. ✅ Firewall is configured
4. ✅ Domain is configured (optional)

**Now you can:**
- Follow `CAPROVER_APPS_GUIDE.md` to deploy your apps
- Create backend and frontend apps
- Set up databases
- Deploy Fanta Build!

---

## Quick Reference Commands

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Check Docker status
systemctl status docker
docker ps

# Check CapRover
docker ps | grep captain
docker logs captain-captain

# Check firewall
ufw status

# Check disk space
df -h

# Check memory
free -h

# Check system info
uname -a
```

---

## Support

If you encounter issues:

1. Check CapRover logs: `docker logs captain-captain`
2. Check Docker logs: `journalctl -u docker`
3. Check system logs: `journalctl -xe`
4. CapRover documentation: https://caprover.com/docs/
5. CapRover GitHub: https://github.com/caprover/caprover
