CONTRACTS_IMAGE := canton-demo-contracts:3.5.1
CONTRACTS_DOCKERFILE := docker/Dockerfile.contracts
CONTRACTS_CONTEXT := docker
CONTRACTS_IMAGE_STAMP := .contracts-image
CONTRACTS_RUN := docker run --rm \
	--user "$$(id -u):$$(id -g)" \
	-e HOME=/tmp \
	-v "$$(pwd)/contracts:/workspace/contracts" \
	-w /workspace/contracts \
	$(CONTRACTS_IMAGE)

.PHONY: start-infra stop-infra clean-infra test-contracts

# INFRA
start-infra:
	docker compose up -d --build

stop-infra:
	docker compose down

clean-infra:
	docker compose down --volumes --remove-orphans --rmi all
	docker image rm -f $(CONTRACTS_IMAGE) >/dev/null 2>&1 || true
	rm -rf $(CONTRACTS_IMAGE_STAMP) contracts/daml/.daml contracts/daml-test/.daml

# CONTRACTS
.contracts-image: $(CONTRACTS_DOCKERFILE)
	docker build -t $(CONTRACTS_IMAGE) -f $(CONTRACTS_DOCKERFILE) $(CONTRACTS_CONTEXT)
	@touch $(CONTRACTS_IMAGE_STAMP)

.build-contracts: $(CONTRACTS_IMAGE_STAMP)
	$(CONTRACTS_RUN) sh -lc 'cd daml && dpm build'

test-contracts: .build-contracts
	$(CONTRACTS_RUN) sh -lc 'cd daml-test && dpm test'
