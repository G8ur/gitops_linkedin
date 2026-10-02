const express = require('express'); // Import express module
const app = express();              // Initialize the app
const PORT = 3000;                  // Define the port number

// Define a route for the root URL ('/')
app.get('/', (req, res) => {
    res.send('Hello, World! Your Node app is running successfully.');
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
