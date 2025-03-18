async function getConfig() {
  const response = await fetch('configuration.json');
  return response.json();
}

function updateStatistics(statistics) {
  const statisticsElement = document.getElementById('statistics');
  statisticsElement.querySelector('#ongoingOrders').textContent = statistics.ongoingOrders;
  statisticsElement.querySelector('#cancelledOrders').textContent = statistics.cancelledOrders;
  statisticsElement.querySelector('#removedOrders').textContent = statistics.removedOrders;
  statisticsElement.querySelector('#totalOrders').textContent = statistics.totalOrders;
  statisticsElement.querySelector('[name="transactionVolume"]').textContent = statistics.transactionVolume;
  statisticsElement.querySelector('[name="netProfit"]').textContent = statistics.netProfit;
  statisticsElement.querySelector('[name="cookiesSold"]').textContent = statistics.cookiesSold;
}

function getStatistics() {
  let statistics = localStorage.getItem('statistics');
  statistics = statistics
    ? JSON.parse(statistics)
    : {
        ongoingOrders: 0,
        cancelledOrders: 0,
        removedOrders: 0,
        totalOrders: 0,
        transactionVolume: 0,
        netProfit: 0,
        cookiesSold: 0,
      };
  if (statistics.ongoingOrders < 0) statistics.ongoingOrders = 0;
  if (statistics.cancelledOrders < 0) statistics.cancelledOrders = 0;
  if (statistics.removedOrders < 0) statistics.removedOrders = 0;
  if (statistics.totalOrders < 0) statistics.totalOrders = 0;
  if (statistics.transactionVolume < 0) statistics.transactionVolume = 0;
  if (statistics.netProfit < 0) statistics.netProfit = 0;
  if (statistics.cookiesSold < 0) statistics.cookiesSold = 0;
  return statistics;
}

function getRecords() {
  let records = localStorage.getItem('records');
  return records ? JSON.parse(records) : {};
}

function formatTimeGap(t1, t2) {
  const time = t2 - t1;
  const seconds = Math.floor(time / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  let timeBuilder = '';
  if (days > 0) timeBuilder += `${days}d, `;
  if (hours > 0) timeBuilder += `${hours % 24}h, `;
  if (minutes > 0) timeBuilder += `${minutes % 60}m, `;
  if (seconds > 0) timeBuilder += `${seconds % 60}s`;
  return timeBuilder;
}

function ongoingRecord(timestamp) {
  const records = getRecords();
  const statistics = getStatistics();
  statistics.ongoingOrders++;
  localStorage.setItem('statistics', JSON.stringify(statistics));
  records[timestamp].status = 'ongoing';
  localStorage.setItem('records', JSON.stringify(records));
}

function confirmRecord(timestamp, config) {
  const records = getRecords();
  const statistics = getStatistics();
  const record = records[timestamp];
  if (record.status && record.status === 'ongoing') {
    statistics.ongoingOrders--;
  }
  statistics.totalOrders++;
  record.cart.forEach((item) => {
    const itemData = config.items.find((configItem) => configItem.id == item.id);
    statistics.transactionVolume += item.quantity * itemData.price;
    statistics.netProfit += item.quantity * itemData.price;
    statistics.cookiesSold += item.quantity;
  });
  if (record.cart.length < 10) {
    statistics.netProfit -= 20;
  }
  localStorage.setItem('statistics', JSON.stringify(statistics));
  delete records[timestamp];
  localStorage.setItem('records', JSON.stringify(records));
}

function cancelRecord(timestamp) {
  const records = getRecords();
  const statistics = getStatistics();
  statistics.cancelledOrders++;
  localStorage.setItem('statistics', JSON.stringify(statistics));
  delete records[timestamp];
  localStorage.setItem('records', JSON.stringify(records));
}

function removeRecord(timestamp) {
  const records = getRecords();
  const statistics = getStatistics();
  statistics.removedOrders++;
  localStorage.setItem('statistics', JSON.stringify(statistics));
  delete records[timestamp];
  localStorage.setItem('records', JSON.stringify(records));
}

function updateRecords(config, records, page) {
  const statistics = getStatistics();
  updateStatistics(statistics);
  const recordWrapper = document.querySelector('.recordWrapper');

  // Clean records
  const originalRecord = recordWrapper.lastElementChild.cloneNode(true);
  if (recordWrapper.childElementCount > 0) {
    while (recordWrapper.childElementCount > 0) {
      recordWrapper.removeChild(recordWrapper.lastElementChild);
    }
  }
  const keys = Object.keys(records);
  const maxPage = Math.ceil(keys.length / 10);

  // Update pages
  document.getElementById('pageCount').textContent = maxPage;
  document.getElementById('page').value = page;
  recordWrapper.appendChild(originalRecord);
  page--;

  const targets = keys.slice(10 * page, 10 * page + 10);
  document.getElementById('fromRecord').textContent = targets.length > 0 ? 10 * page + 1 : 0;
  document.getElementById('toRecord').textContent = 10 * page + targets.length;
  document.getElementById('maxRecord').textContent = keys.length;
  document.getElementById('noRecords').style.setProperty('display', targets.length > 0 ? 'none' : 'block');

  const timeNow = Date.now();
  targets.forEach((timestamp) => {
    const record = records[timestamp];
    const recordElement = recordWrapper.lastElementChild;
    recordWrapper.appendChild(recordElement.cloneNode(true));
    const time = formatTimeGap(timestamp, timeNow);
    recordElement.querySelector('[name="time"]').textContent = time;
    recordElement.querySelector('[name="time"]').setAttribute('time', timestamp);

    const details = record.details;
    recordElement.querySelector('[name="firstName"]').textContent = details.firstName;
    recordElement.querySelector('[name="lastName"]').textContent = details.lastName;
    recordElement.querySelector('[name="fullAddress"]').textContent = `
  ${details.aptSuite ? details.aptSuite + ', ' : ''}${details.streetAddress}, ${details.zipCode}, ${details.region}, ${
      details.city
    }, ${details.country}
  `;
    recordElement.querySelector('[name="paymentMethod"]').textContent = details.paymentMethod;

    let cookieCount = 0;
    let transactionVolume = 0;
    let netProfit = 0;
    const cookieDistribution = recordElement.querySelector('[name="cookieDistribution"]');
    record.cart.forEach((item) => {
      const itemData = config.items.find((configItem) => configItem.id == item.id);
      cookieCount += item.quantity;
      const itemPrice = itemData.price * item.quantity;
      transactionVolume += itemPrice;
      netProfit += itemPrice;
      if (cookieCount < 10) {
        netProfit -= 20;
      }

      const cookieElement = cookieDistribution.lastElementChild;
      cookieDistribution.appendChild(cookieElement.cloneNode(true));
      cookieElement.querySelector('[name="count"]').textContent = item.quantity;
      cookieElement.querySelector('.cookieFlavor').textContent = itemData.name;
    });
    cookieDistribution.removeChild(cookieDistribution.lastElementChild);

    recordElement.querySelector('[name="totalCookieCount"]').textContent = cookieCount;
    recordElement.querySelector('[name="transactionVolume"]').textContent = transactionVolume;
    recordElement.querySelector('[name="netProfit"]').textContent = netProfit;

    recordElement.querySelector('.btns').setAttribute('id', timestamp);
    if (record.status && record.status === 'ongoing') {
      recordElement.style.setProperty('border', 'dashed 2px green');
      recordElement.querySelector('.ongoing').style.setProperty('display', 'none');
    } else {
      recordElement.querySelector('.ongoing').addEventListener('click', () => {
        console.log('Ongoing ' + timestamp + '...');
        ongoingRecord(timestamp);
        window.location.reload();
      });
    }
    recordElement.querySelector('.confirm').addEventListener('click', () => {
      console.log('Confirming ' + timestamp + '...');
      confirmRecord(timestamp, config);
      window.location.reload();
    });
    recordElement.querySelector('.cancel').addEventListener('click', () => {
      console.log('Canceling ' + timestamp + '...');
      cancelRecord(timestamp);
      window.location.reload();
    });
    recordElement.querySelector('.remove').addEventListener('click', () => {
      console.log('Removing ' + timestamp + '...');
      removeRecord(timestamp);
      window.location.reload();
    });
  });

  // Remove duplicate record
  recordWrapper.removeChild(recordWrapper.lastElementChild);

  // Extend timeout
  console.log('Timeout has been extended by 5 minutes.');
  localStorage.setItem('admin', Date.now() + 5 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Assessing authorization...');

  // Use JWT if for production
  if (Number(localStorage.getItem('admin') ?? 0) < Date.now()) {
    console.log('Session has expired.');
    window.location.href = './login.html';
    return;
  }

  document.querySelector('.loggedOut').classList.remove('loggedOut');

  getConfig().then((config) => {
    let records = getRecords();
    const keys = Object.keys(records);
    const maxPage = Math.ceil(keys.length / 10);
    let page = 1;

    updateRecords(config, records, page);
    document.getElementById('prevRecord').addEventListener('click', () => {
      if (page <= 1) {
        alert('You are on the first page.');
        return;
      }
      page--;
      records = getRecords();
      updateRecords(config, records, page);
    });

    document.getElementById('nextRecord').addEventListener('click', () => {
      if (page >= maxPage) {
        alert('You are on the last page.');
        return;
      }
      page++;
      records = getRecords();
      updateRecords(config, records, page);
    });

    setInterval(() => {
      if (Number(localStorage.getItem('admin') ?? 0) < Date.now()) {
        window.location.href = './login.html';
        return;
      }
      const timeNow = Date.now();
      document.querySelectorAll('[name="time"').forEach((element) => {
        const timestamp = parseInt(element.getAttribute('time'));
        const time = formatTimeGap(timestamp, timeNow);
        element.textContent = time;
      });
    }, 1000);
  });
});
