import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.sk_test_51T4M38KcN6CsQSzRBrLuZu8tf7EjGhhNmfVK1NTZovWT6vL6ai83SeoEKmpfNYWwdRCnFoa31pGZUghsVjIV04o400VWMrl69c);

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));