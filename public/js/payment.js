(function () {
  const payButton = document.querySelector('[data-pay-button]');
  const status = document.querySelector('[data-payment-status]');
  const configElement = document.querySelector('[data-payment-config]');

  if (!payButton || !configElement) {
    return;
  }

  const config = {
    createOrderUrl: configElement.dataset.createOrderUrl,
    verifyUrl: configElement.dataset.verifyUrl,
    keyConfigured: configElement.dataset.keyConfigured === 'true'
  };

  function setStatus(message) {
    status.textContent = message;
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body || {})
    });

    const payload = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(payload.message || 'Request failed.');
    }

    return payload;
  }

  payButton.addEventListener('click', async function () {
    if (!config.keyConfigured) {
      setStatus('Razorpay is not configured.');
      return;
    }

    if (!window.Razorpay) {
      setStatus('Razorpay checkout could not load.');
      return;
    }

    payButton.disabled = true;
    setStatus('Creating secure order...');

    try {
      const order = await postJson(config.createOrderUrl);
      const checkout = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: order.salonName,
        description: order.serviceName,
        order_id: order.orderId,
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone
        },
        theme: {
          color: '#a45bff'
        },
        handler: async function (response) {
          setStatus('Verifying payment...');
          const result = await postJson(config.verifyUrl, response);
          window.location.href = result.redirectUrl || '/dashboard';
        }
      });

      checkout.on('payment.failed', function () {
        payButton.disabled = false;
        setStatus('Payment failed. Please try again.');
      });

      checkout.open();
      setStatus('');
    } catch (error) {
      payButton.disabled = false;
      setStatus(error.message);
    }
  });
})();
