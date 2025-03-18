function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function loadCart(cart, config) {
  if (cart.length === 0) {
    window.location.href = './index.html#productsSection';
    return;
  }
  const itemWrapper = document.querySelector('.itemWrapper');
  const original = itemWrapper.lastElementChild.cloneNode(true);
  if (itemWrapper.childElementCount > 0) {
    while (itemWrapper.childElementCount > 0) {
      itemWrapper.removeChild(itemWrapper.lastElementChild);
    }
  }
  itemWrapper.appendChild(original);
  let subTotal = 0;
  let itemCount = 0;
  cart.forEach((item) => {
    const itemElement = itemWrapper.lastElementChild;
    itemWrapper.appendChild(itemWrapper.lastElementChild.cloneNode(true));
    const itemData = config.items.find((configItem) => configItem.id == item.id);

    itemElement.querySelector('[name="name"]').textContent = itemData.name;
    itemElement.querySelector('[name="quantity"]').textContent = item.quantity;
    itemElement.querySelector('[name="details"]').textContent = itemData.description;
    itemElement.querySelector('[name="pricePlaceholder"]').textContent = itemData.price;

    const itemPrice = itemData.price * item.quantity;
    subTotal += itemPrice;
    itemCount += item.quantity;

    itemElement.querySelector('.add').addEventListener('click', function () {
      addItemToCart(item.id, 1);
      loadCart(getCart(), config);
    });

    itemElement.querySelector('.remove').addEventListener('click', function () {
      removeItemFromCart(item.id, 1);
      loadCart(getCart(), config);
    });
  });
  itemWrapper.lastElementChild.remove();

  const cartContainer = document.getElementById('cartContainer');
  cartContainer.querySelector('[name="subTotalPrice"]').textContent = subTotal;
  cartContainer.querySelectorAll('[name="itemCount"]').forEach((element) => (element.textContent = itemCount));

  const deliveryFee = itemCount < 10 ? 20 : 0;
  cartContainer.querySelector('[name="deliveryPrice"]').textContent = deliveryFee;

  const estimatedTax = 0; // Assume no tax for now
  const total = subTotal + deliveryFee + estimatedTax;
  cartContainer.querySelector('[name="totalPrice"]').textContent = total;
}

function addItemToCart(id, quantity) {
  const cart = getCart();
  const existingItem = cart.find((cartItem) => cartItem.id === id);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ id, quantity });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
}

function removeItemFromCart(id, quantity) {
  const cart = getCart();
  const existingItem = cart.find((cartItem) => cartItem.id === id);
  if (existingItem) {
    existingItem.quantity -= quantity;
    if (existingItem.quantity <= 0) {
      const index = cart.indexOf(existingItem);
      cart.splice(index, 1);
    }
  }

  localStorage.setItem('cart', JSON.stringify(cart));
}

async function getConfig() {
  const response = await fetch('configuration.json');
  return response.json();
}

function getDetails() {
  const details = {};
  document.querySelectorAll('input, select').forEach((input) => {
    details[input.name] = input.value;
  });
  const paymentMethod = document.getElementById('paymentMethod').getAttribute('value-selected');
  details['paymentMethod'] = paymentMethod;
  return details;
}

function getRecords() {
  let records = localStorage.getItem('records');
  return records ? JSON.parse(records) : {};
}

function checkout(cart) {
  const details = getDetails();
  if (
    !details.email ||
    !details.firstName ||
    !details.lastName ||
    !details.phoneNumber ||
    !details.streetAddress ||
    !details.city ||
    !details.region ||
    !details.zipCode ||
    !details.country
  ) {
    alert('Please fill in all the required fields');
    return;
  }

  if (details.paymentMethod === 'creditCard') {
    if (!details.cardNumber || !details.cardNumber || !details.cardExpiry || !details.cardCVC) {
      alert('Please fill in all the required fields');
      return;
    }
  } else if (details.paymentMethod === 'gCash') {
    if (!details.gCashNumber || !details.gCashName) {
      alert('Please fill in all the required fields');
      return;
    }
  }

  localStorage.removeItem('cart');
  const records = getRecords();
  records[Date.now()] = {
    cart: cart,
    details: details,
  };
  localStorage.setItem('records', JSON.stringify(records));
  alert('Your order has been placed!\nWait for the confirmation SMS message.\nYou will now be returning to the home page...');
  window.location.href = './index.html';
}

getConfig().then((config) => {
  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = './index.html#productsSection';
    return;
  }
  loadCart(cart, config);

  document.getElementById('checkoutBtn').addEventListener('click', function () {
    checkout(cart, config);
  });

  document.querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', function () {
      select.setAttribute('data-selected', select.value);
    });
  });

  document.querySelectorAll('[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      document.getElementById('paymentMethod').setAttribute('value-selected', radio.value);
    });
  });
});
