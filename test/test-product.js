const autocannon = require('autocannon');

const url = 'http://localhost:7326';
const getProuctionInfoInstance = autocannon({
    url: `${url}/api/product/70171927/{pic_array,desc}`,
    connections: 100,
    pipelining: 10,
    duration: 5,
});

// const addShoppingInstance = autocannon({
//     url: `${url}/api/shoppingcart/70171927/585/add`,
//     method: 'POST',
//     headers: {
//         Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjVlYmY5MzJhMzBkN2YzMjFiNDNiZjA5MiIsImVtYWlsIjoibGpkOTcyNkAxNjMuY29tIn0sImlhdCI6MTU4OTYxMzQxNCwiZXhwIjoxNTkwODIzMDE0fQ.8H1fV1kDEo3FVRF8w5R_cai3xWF_GjFJiPc8QTACIYE'
//     },
//     connections: 100,
//     pipelining: 1,
//     duration: 5,
// });
// process.once('SIGINT', () => {
//     getProuctionInfoInstance.stop();
//     addShoppingInstance.stop();
// });

autocannon.track(getProuctionInfoInstance, { renderProgressBar: false });
// autocannon.track(addShoppingInstance, { renderProgressBar: false });
