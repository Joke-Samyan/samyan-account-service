dev-local:
	@echo Start service samyan account service
	docker-compose up -d

clean-local:
	@echo Stop service samyan account service
	docker-compose down