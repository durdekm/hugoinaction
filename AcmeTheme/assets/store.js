import { matchTemplate } from "./util"

let cart = [];
let products = {};

export default {
  async init() {
    this.template = document.querySelector("#cart-item").innerHTML;
    this.badge = document.querySelector(".cart .badge");
    document.querySelectorAll(".addToCart").forEach(add => {
      add.addEventListener("click", (e) => {
        e.preventDefault();
        const data = new FormData(add.form);
        const name = data.get("name");
        const color = data.get("color");
        if (!cart.find(x => x.name === name && x.color === color)) {
          cart.push({ name, color });
        }
        this.render();
        this.save();
      });
    });
    await this.productInfo();
    window.addEventListener('storage', this.updateCart.bind(this));
    this.updateCart();
  },

  updateCart() {
    const disk = JSON.parse(window.localStorage.getItem("cart") || "[]");
    cart= Array.isArray(disk) ? disk : [];
    this.render();
  },

  async productInfo() {
    const response = await window.fetch(BASE_URL + "/store/index.json");
    if (response.ok) {
      products = await response.json();
    }
  },

  save() {
    window.localStorage.setItem("cart", JSON.stringify(cart));
  },

  onDelete: function (e) {
    cart.splice(cart.findIndex(x =>
      x.name == e.currentTarget.dataset.name && x.color === e.currentTarget.dataset.color
    ), 1);
    this.render();
    this.save();
  },

  render() {
    this.badge.innerText =cart.length;
    if (cart.length === 0) {
      document.querySelector(".cart").classList.remove("visible");
    } else {
      document.querySelector(".cart").classList.add("visible");
    }

    try {
      const info =cart.map(x => ({ ...x, price: parseFloat(products[x.name].price.substr(1)), cover: products[x.name].cover }));

      if (info.length > 0) {
        // Find the prices.
        document.querySelector(".cart > div").innerHTML = info.map(x => matchTemplate(this.template, Object.entries(x))).join("\n");
        for (let del of document.querySelectorAll(".cart .delete")) {
          del.addEventListener("click", this.onDelete.bind(this));
        }
      }
    } catch (e) {
      console.error(e)
      document.querySelector(".cart > div").innerHTML = `We have an error. Please contact customer support`;
    }
  }
}
