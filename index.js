function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
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
  alert(`Added ${quantity} of Id ${id} to cart.`);
}

async function getConfig() {
  const response = await fetch('configuration.json');
  return response.json();
}

getConfig().then((config) => {
  const itemWrapper = document.querySelector('.itemWrapper');
  config.items?.forEach((item) => {
    const itemElement = itemWrapper.lastElementChild;
    itemWrapper.appendChild(itemWrapper.lastElementChild.cloneNode(true));
    itemWrapper.setAttribute('identifier', item.id);
    itemElement.querySelector('[name="displayName"]').textContent = item.name;
    itemElement.querySelector('[name="price"]').textContent = item.price;
    itemElement.querySelector('[name="image"').src = item.image;
    const positive = item.stars;
    const blank = 5 - positive;

    const stars = itemElement.querySelector('[name="rating"]');
    for (let i = 0; i < positive - 1; i++) {
      stars.prepend(stars.firstElementChild.cloneNode(true));
    }
    for (let i = 0; i < blank - 1; i++) {
      stars.append(stars.lastElementChild.cloneNode(true));
    }

    itemElement.querySelector('[name="addToCart"]').addEventListener('click', function () {
      addItemToCart(item.id, 1);
    });
  });
  itemWrapper.removeChild(itemWrapper.lastElementChild);

  document.getElementById('cartBtn').addEventListener('click', function () {
    getCart().length > 0 ? (window.location.href = '/checkout') : alert('Cart is empty');
  });

  document.getElementById('loginBtn')?.addEventListener('click', function () {
    window.location.href = '/login';
  });

  document.getElementById('logoutBtn')?.addEventListener('click', function () {
    window.location.href = '/logout';
  });
});
