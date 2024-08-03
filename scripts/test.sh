if [ -z "$(docker network ls -qf name=^entropic$)" ]; then
  echo "Creating network"
  docker network create entropic >/dev/null
fi

COMPOSE_HTTP_TIMEOUT=120 docker compose -f docker-compose.dev.yml up -d --force-recreate