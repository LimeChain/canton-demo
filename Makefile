.PHONY: start-infra stop-infra clean-infra

# INFRA
start-infra:
	docker compose up -d --build

stop-infra:
	docker compose down

clean-infra:
	docker compose down --volumes --remove-orphans --rmi all
