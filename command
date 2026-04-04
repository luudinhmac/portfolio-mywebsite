# Xem Error Log để biết MariaDB có kêu cứu gì không
ansible db_servers -m shell -a "tail -n 20 /var/log/mysql/error.log"

# Theo dõi Slow Query (Nếu app của bạn chạy chậm)
ansible db_servers -m shell -a "tail -f /var/log/mysql/mariadb-slow.log"

# 
ssh macld@192.168.157.109 'cd /home/macld/portfolio-app && git pull origin main && REV=$(git rev-parse --short HEAD) && docker build -t portfolio-app:$REV -t portfolio-app:latest . && (docker stop portfolio-app || true) && (docker rm portfolio-app || true) && docker run -d --name portfolio-app -p 3000:3000 --env-file .env --restart always portfolio-app:latest && docker image prune -f'
ssh macld@192.168.157.109 'cd /home/macld/portfolio-app && git pull origin main && REV=$(git rev-parse --short HEAD) && docker build -t portfolio-app:$REV -t portfolio-app:latest . && (docker stop portfolio-app || true) && (docker rm portfolio-app || true) && docker run -d --name portfolio-app -p 127.0.0.1:3000:3000 --env-file .env --restart always portfolio-app:latest && docker image prune -f'
