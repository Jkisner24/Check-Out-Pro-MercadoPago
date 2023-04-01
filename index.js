const express = require ('express')
const http = require ('http')
const cors = require ('cors')
const app = express();
const bodyParser = require('body-parser')
const mercadopago = require("mercadopago");
mercadopago.configure({
    access_token: "APP_USR-6693297450833866-033008-20ca02011555d81054b79b340f47fcd5-1341811513"
});

app.set('port', 3003)
app.use(bodyParser.json())

app.get('/generar', (req, res) =>{
    let preference = {
    back_urls:{
        success: 'http://localhost:3003/success'
    },
    items: [
        {
        title: 'Mi producto',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: 240 
        },
    ],
    notification_url: 'https://check-out-pro-mercado-pago.vercel.app'
};

mercadopago.preferences
.create(preference)
.then(function(response){
    console.log(response.body.init_point)
    res.send(`<a href="${response.body.init_point}">Ir a pagar</a>`)
    }).catch(function(error){
      console.log(error);
    });
})


app.get('/success', (req, res)=>{
    res.send('Compra ok');
})

app.post('/notificar', async (req,res)=>{
    console.log('notificacion');
    const {query} = req;
    const topic = query.topic || query.type;
    console.log({topic})

    switch(topic){
        case "payment":
            const paymentId = query.id || query['data.id'];
            console.log(topic, 'gettin payment', paymentId);
            const payment = await mercadopago.payment.findById(paymentId);
            console.log(payment)
            var {body} = await mercadopago.merchant_orders.findById(payment.body.order.id)
            break;
        case "merchant_order":
            const orderId = query.id;
            console.log(topic, 'gettin merchant order', orderId);
            var {body} = await mercadopago.merchant_orders.findById(orderId);
            break;
    }

    //console.log(body.payments)

    let paidAmount = 0;
    body.payments.forEach(payment =>{
        if(payment.status === 'approved'){
            paidAmount += payment.transaction_amount;
        }
        
    })
    
    if(paidAmount >= body.total_amount){
        console.log('El pago se completó')
        //LOGICA PARA CONECTAR


    }else{
        console.log('El pago no se completó')
    }


    res.send();
})

//mercadopago.merchant_orders.findById('8446114506').then(res => console.log(res.body))

http.createServer(app).listen(app.get('port'), ()=>{
    console.log('* HTTP escuchando en puerto' + app.get('port'))
})