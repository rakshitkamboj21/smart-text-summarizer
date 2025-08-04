document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('signupForm');
  const signupMessage = document.getElementById('signupMessage');

  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!username || !email || !password) {
      displayMessage('All fields are required.', 'error');
      return;
    }

    if (password.length < 6) {
      displayMessage('Password must be at least 6 characters long.', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        displayMessage(`✅ ${data.msg || 'Account created successfully!'}`, 'success');
        signupForm.reset();
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        displayMessage(`❌ ${data.msg || 'Registration failed'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      displayMessage('❌ Network error. Please try again.', 'error');
    }
  });

  function displayMessage(msg, type) {
    signupMessage.textContent = msg;
    signupMessage.style.color = type === 'error' ? 'red' : 'green';
  }
});
