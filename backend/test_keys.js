const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: "rzp_test_TV9lK03aYfyyEi",
  key_secret: "n8UvDQIox332gOG6OpaTZLQu",
});

async function test() {
  try {
    const order = await razorpay.orders.create({
      amount: 50000,
      currency: 'INR',
      receipt: 'test_receipt',
    });
    console.log("SUCCESS!", order.id);
  } catch (error) {
    console.error("FAILED!", error);
  }
}

test();
