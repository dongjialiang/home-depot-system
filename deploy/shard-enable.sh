docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.enableSharding(\"myapp\")' | mongo"
docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.shardCollection(\"myapp.user\", {\"email\": 1 })' | mongo"
docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.shardCollection(\"myapp.products\", {\"product_id\": 1 })' | mongo"
docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.shardCollection(\"myapp.admin\", {\"username\": 1 })' | mongo"
