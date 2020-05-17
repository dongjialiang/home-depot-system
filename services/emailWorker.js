const amqp = require('amqplib');
const { sendVerifyEmail } = require('../config/mailer');

require('dotenv').config('../config/.env');

const queue = 'email-task';
// 连接rabbitmq
const connection = amqp.connect(process.env.AMQP_SERVER);
// 生产者
const publishMessage = payload => connection
    .then(conn => conn.createChannel())
    .then(channel => channel.assertQueue(queue, {
        durable: false,
    })
        .then(() => channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)))))
    .catch(err => console.error(err));
// 消费者
const consumeMessage = () => {
    connection
        .then(conn => conn.createChannel())
        .then(channel => channel.assertQueue(queue, {
            durable: false,
        })
            .then(() => {
                console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', queue);
                return channel.consume(queue, (msg) => {
                    if (msg != null) {
                        const mailOption = JSON.parse(msg.content.toString());
                        sendVerifyEmail(mailOption.user, mailOption.expires_time, mailOption.title, mailOption.content);
                        channel.ack(msg);
                    }
                })
            }))
            .catch(err => console.error(err));
}
module.exports = { publishMessage, consumeMessage };
