document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.input-form');
  const tickerInput = document.getElementById('ticker');
  const clearBtn = document.getElementById('clear-btn');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    console.log('Searching for:', tickerInput.value);
    const ticker = tickerInput.value.trim();
    if (!ticker) return;
    
    try {
      const response = await fetch(`/get_stock_data?ticker=${ticker}`);
      const data = await response.json();
      
      if (data.error) {
        renderError(data.error);
        return;
      }
      
      renderResults(data);
    } catch(error) {
      console.error('Error fetching data: ', error);
      alert('Failed to fetch data.');
    }
  });

  clearBtn.addEventListener('click', function () {
    tickerInput.value = '';
    const existing = document.getElementById('results');
    if (existing) existing.remove();
    const errorDiv = document.getElementById('error');
    if (errorDiv) errorDiv.remove();
  });
  
  function renderResults(data) {
    const existing = document.getElementById('results');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.id = 'results';
    container.className = 'result-container';

    container.innerHTML = `
      <div class="tab-bar">
        <div class="tab active-tab" data-tab="outlook">Company Outlook</div>
        <div class="tab" data-tab="summary">Stock Summary</div>
        <div class="tab" data-tab="history">Search History</div>
      </div>

      <div class="tab-content" id="outlook" style="display: block;">
        <table>
          <tr><th>Company Name</th><td>${data.name}</td></tr>
          <tr><th>Ticker</th><td>${data.ticker}</td></tr>
          <tr><th>Exchange Code</th><td>${data.exchangeCode}</td></tr>
          <tr><th>Start Date</th><td>${data.startDate}</td></tr>
          <tr><th>Description</th><td>${data.description}</td></tr>
        </table>
      </div>

      <div class="tab-content" id="summary" style="display: none;"></div>
      <div class="tab-content" id="history" style="display: none;"></div>
      <div class="tab-content" id="error" style="display: none;"></div>
    `;

    document.body.appendChild(container);
    
    const tabs = container.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        tabs.forEach(t => t.classList.remove('active-tab'));
        container.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

        tab.classList.add('active-tab');
        const activeId = tab.getAttribute('data-tab');
        const contentDiv = document.getElementById(activeId);
        contentDiv.style.display = 'block';
        
        const companyTable = document.getElementById('outlook');
        if (activeId === 'summary') {
          if (companyTable) companyTable.style.display = 'none';
          try {
            const response = await fetch(`/get_stock_summary?ticker=${data.ticker}`);
            const summaryData = await response.json();
            
            if (summaryData.error) {
              renderError(summaryData.error);
              return;
            }
            
            renderSummary(summaryData);
          } catch(error) {
            console.error('Error fetching data: ', error);
            alert('Failed to fetch data.');
          }
        } else if (activeId === 'outlook') {
          if (companyTable) companyTable.style.display = 'block';
        } else if (activeId === 'history') {
          try {
            const response = await fetch('/history');
            const historyData = await response.json();
            renderHistory(historyData);
          } catch(error) {
            console.error('Error fetching history:', error);
            alert('Failed to load search history.');
          }
        }
      });
    });
  }
  
  function renderSummary(data) {
    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = `
      <table id="stock-summary">
        <tr><th>Stock Ticker Symbol</th><td>${data.ticker}</td></tr>
        <tr><th>Trading Day</th><td>${data.date}</td></tr>
        <tr><th>Previous Closing Price</th><td>${data.prevClose}</td></tr>
        <tr><th>Opening Price</th><td>${data.open}</td></tr>
        <tr><th>High Price</th><td>${data.high}</td></tr>
        <tr><th>Low Price</th><td>${data.low}</td></tr>
        <tr><th>Last Price</th><td>${data.last}</td></tr>
        <tr><th>Change</th><td>${data.change} ${getArrowIcon(data.change)}</td></tr>
        <tr><th>Change Percent</th><td>${data.changep}% ${getArrowIcon(data.change)}</td></tr>
        <tr><th>Number of Shares Traded</th><td>${data.volume}</td></tr>
      </table>
    `;
  }
  
  function renderHistory(data) {
    const historyDiv = document.getElementById('history');
    if (!data || data.length === 0) {
      historyDiv.innerHTML = '<p>No history found.</p>';
      return;
    }

    let html = `
      <table id="history">
        <thead><tr><th>Ticker</th><th>Timestamp</th></tr></thead>
        <tbody>
    `;
    for (const entry of data) {
      html += `<tr><td>${entry.ticker}</td><td>${entry.timestamp}</td></tr>`;
    }
    html += '</tbody></table>';

    historyDiv.innerHTML = html;
  }
  
  function renderError(message) {
    const existingResults = document.getElementById('results');
    if (existingResults) existingResults.remove();
    
    let errorDiv = document.getElementById('error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'error';
      errorDiv.className = 'tab-content';
      document.body.appendChild(errorDiv);
    }

    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active-tab'));

    errorDiv.innerHTML = `<h4>Error: ${message}</h4>`;
    errorDiv.style.display = 'block';
  }
  
  function getArrowIcon(value) {
    if (typeof value === 'number') {
      if (value > 0) {
        return '<img src="/static/images/GreenArrowUP.png" class="arrow-icon">';
      } else if (value < 0) {
        return '<img src="/static/images/RedArrowDown.png" class="arrow-icon">';
      }
    }
    return '';
  }
});