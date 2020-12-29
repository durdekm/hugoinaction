let endpoint = "https://hugoinaction.github.io/GitHubPagesStore"

////////////////////////////////////////////////////////////////
// Getting deploy path for multi-branch builds on Netlify
// using stored environment variables begin
// the env.json is dynamically created by preinstall.js script
// provided along with the current file.
////////////////////////////////////////////////////////////////
const env = require("./env.json");
if (env.NETLIFY) {
  endpoint = env.DEPLOY_PRIME_URL;
}
////////////////////////////////////////////////////////////////
// End custom code for getting build details from Netlify.
////////////////////////////////////////////////////////////////
const stripe = require('stripe')(env.STRIPE_PRIVATE_KEY);
const fetch = require("node-fetch");

module.exports = {
  /**
   * Function to handle calls to the API endpoint of the cloud function.
   */
  async handler(event, context) {
    if (
      !event.queryStringParameters ||
      !event.queryStringParameters.products
    ) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "No products supplied.",
        }),
      };
    }

    let error = "Unknown error";

    try {
      let products = event.queryStringParameters.products;
      if (!Array.isArray(products)) {
        products = products.split(",");
      }

      const data = await fetch(`${endpoint}/store/index.json`);


      if (data.ok) {
        const table = await data.json();
        const stripeData = {
          payment_method_types: ['card'],
          line_items: [
          ],
          mode: 'payment',
          success_url: `${endpoint}${decodeURIComponent(event.queryStringParameters.success)}`,
          cancel_url: `${endpoint}${decodeURIComponent(event.queryStringParameters.cancel)}`,
          metadata: { }
        };

        products.forEach((x, i) => {
          stripeData.metadata["item " + i] = x.trim();
          const name = x.split("_")[0].trim();
          const color = x.split("_")[1].trim();
          stripeData.line_items.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${name}(${color})`,
                images: [table[name].cover],
              },
              unit_amount: parseFloat(table[name].price.trim().substr(1)) * 100,
            },
            quantity: 1,
          })
        });

        const session = await stripe.checkout.sessions.create(stripeData);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            stripeData,
            products
          }),
        };
      } else {
        error = `Could not fetch pricing table due to ${data.statusCode}`;
      }
    } catch (e) {
      error = e.message;
    }

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error
      }),
    };


  },
};
