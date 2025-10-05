.PHONY: help builddockerdev rundockerdev

help:
	@echo "Available commands:"
	@echo "  make builddockerdev    - build all docker images in dev environment"
	@echo "  make rundockerdev - run all docker containers in dev environment"

builddockerdev:
	docker-compose -f docker-compose-dev.yml build
rundockerdev:
	docker-compose -f docker-compose-dev.yml up

lintpyapps:
	uvx pre-commit run -a