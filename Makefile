CONTRACTS_IMAGE := canton-demo-contracts:3.5.1
CONTRACTS_DOCKERFILE := docker/Dockerfile.contracts
CONTRACTS_CONTEXT := docker
CONTRACTS_IMAGE_STAMP := .contracts-image
WORKSPACE_RUN := docker run --rm \
	--user "$$(id -u):$$(id -g)" \
	-e HOME=/tmp \
	-v "$$(pwd):/workspace" \
	-w /workspace \
	$(CONTRACTS_IMAGE)

.PHONY: start-infra stop-infra clean-infra test-contracts deploy-contracts

# INFRA
start-infra:
	docker compose up -d --build

stop-infra:
	docker compose down

clean-infra:
	docker compose down --volumes --remove-orphans --rmi all
	docker image rm -f $(CONTRACTS_IMAGE) >/dev/null 2>&1 || true
	rm -rf $(CONTRACTS_IMAGE_STAMP) .demo contracts/daml/.daml contracts/daml-test/.daml scripts/daml/.daml

# DAML
.contracts-image: $(CONTRACTS_DOCKERFILE)
	docker build -t $(CONTRACTS_IMAGE) -f $(CONTRACTS_DOCKERFILE) $(CONTRACTS_CONTEXT)
	@touch $(CONTRACTS_IMAGE_STAMP)

.build-daml: $(CONTRACTS_IMAGE_STAMP)
	$(WORKSPACE_RUN) dpm build --all

test-contracts: .build-daml
	$(WORKSPACE_RUN) sh -lc 'cd contracts/daml-test && dpm test'

deploy-contracts: .build-daml
	./scripts/deploy-contracts.sh
