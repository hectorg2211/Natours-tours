import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51Jfr1nGi4Mxbt8fRqFOVfXLsyooWN9tKcySTsmX46XLfKBYLCb60owwJGMlBNF1Ihd9ApO3GBpNStosQhZUxjZuH00yf0yqv8k'
    );

    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    // console.log(error);
    showAlert('error', error);
  }
};
