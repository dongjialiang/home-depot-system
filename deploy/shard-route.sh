docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.addShard(\"shard1/shard1:27018\")' | mongo"
docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.addShard(\"shard2/shard2:27018\")' | mongo"
docker-compose -f docker-compose-test.yml exec mongos bash -c "echo 'sh.addShard(\"shard3/shard3:27018\")' | mongo"
