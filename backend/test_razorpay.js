const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: "rzp_test_TV5RQvUG8dtAdH",
  key_secret: "jGgJijB16PzB2amZk8FXHwIE",
});

razorpay.orders.create({
  amount: 100,
  currency: "INR",
  receipt: "test"
}).then(console.log).catch(err => console.error("Error:", err));
