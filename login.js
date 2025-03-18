document.querySelector('button').addEventListener('click', function () {
  const username = document.querySelector('[name="username"]').value;
  const password = document.querySelector('[name="password"]').value;

  // Use JWT if for production
  if (username === 'admin' && password === '1234') {
    localStorage.setItem('admin', Date.now() + 5 * 60 * 1000);
    window.location.href = './admin.html';
  } else {
    alert('Invalid credentials');
  }
});
