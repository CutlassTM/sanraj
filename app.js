const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
const nodemailer = require('nodemailer');



// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'mysql-sanraj2.alwaysdata.net',
    user: 'sanraj2',
    password: 'Watermelon123',
    database: 'sanraj2_project'
    
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('public'));

// Enable form processing
app.use(express.urlencoded({
    extended: false
}));

// Define route to fetch all reviews
app.get('/', (req, res) => {
    const eventsSql = 'SELECT * FROM events';
    const reviewsSql = 'SELECT * FROM reviews';

    // Fetch events data from MySQL
    connection.query(eventsSql, (errorEvents, resultsEvents) => {
        if (errorEvents) {
            console.error('Events data query error:', errorEvents.message);
            return res.status(500).send('Error retrieving events');
        }

        // Fetch reviews data from MySQL
        connection.query(reviewsSql, (errorReviews, resultsReviews) => {
            if (errorReviews) {
                console.error('Reviews data query error:', errorReviews.message);
                return res.status(500).send('Error retrieving reviews');
            }

            // Render HTML page with events and reviews data
            res.render('index', { events: resultsEvents, reviews: resultsReviews });
        });
    });
});


app.get('/event/:id', (req, res) => {
    // Extract the event ID from the request parameters
    const eventId = req.params.id;
    const sql = 'SELECT * FROM events WHERE eventId = ?';
    // Fetch data from MySQL based on the event ID
    connection.query(sql, [eventId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving event by ID');
        }
        // Check if any event with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the event data
            res.render('event', { event: results[0] });
        } else {
            // If no event with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Event not found');
        }
    });
});

// Add Event
app.get('/addEvent', (req, res) => {
    res.render('addEvent');
});

// Add Event
app.post('/addEvent', upload.single('image'), (req, res) => {
    // Extract event data from the request body
    const { title, date, location, desc } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // Save only the filename
    } else {
        image = null;
    }

    const sql = 'INSERT INTO events (title, date, location, `desc`, image) VALUES (?, ?, ?, ?, ?)';
    // INSERT the new event into the database
    connection.query(sql, [title, date, location, desc, image], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding event:", error);
            res.status(500).send('Error adding event');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

// Edit Event
app.get('/editEvent/:id', (req, res) => {
    const eventId = req.params.id;
    const sql = 'SELECT * FROM events WHERE eventId = ?';
    // Fetch data from MySQL based on the event ID
    connection.query(sql, [eventId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving event by ID');
        }
        // Check if any event with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the event data
            res.render('editEvent', { event: results[0] });
        } else {
            // If no event with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Event not found');
        }
    });
});

app.post('/editEvent/:id', upload.single('image'), (req, res) => {
    const eventId = req.params.id;
    // Extract event data from the request body
    const { title, date, location, desc } = req.body;
    let image = req.body.currentImage; // retrieve current image filename
    if (req.file) {
        image = req.file.filename; // Set image to be new image filename
    }
    const sql = 'UPDATE events SET title = ?, date = ?, location = ?, `desc` = ?, image = ? WHERE eventId = ?';

    // UPDATE the event in the database
    connection.query(sql, [title, date, location, desc, image, eventId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating event:", error);
            res.status(500).send('Error updating event');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

// Delete Event
app.get('/deleteEvent/:id', (req, res) => {
    const eventId = req.params.id;
    const sql = 'DELETE FROM events WHERE eventId = ?';
    connection.query(sql, [eventId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting event:", error);
            res.status(500).send('Error deleting event');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

// ------------------------------------------------------------------


// Define route to fetch a review by ID
app.get('/review/:id', (req, res) => {
    // Extract the review ID from the request parameters
    const reviewId = req.params.id;
    const sql = 'SELECT * FROM reviews WHERE reviewId = ?';
    // Fetch data from MySQL based on the review ID
    connection.query(sql, [reviewId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving review by ID');
        }
        // Check if any review with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the review data
            res.render('review', { review: results[0] });
        } else {
            // If no review with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Review not found');
        }
    });
});


// Add Review - GET Route to render the form
app.get('/addReview', (req, res) => {
    res.render('addReview'); // Render the 'addReview' view file
});

// Add Review - POST Route to handle form submission
app.post('/addReview', (req, res) => {
    // Extract review data from the request body
    const { reviewer, rating, comment, rdate } = req.body;

    const sql = 'INSERT INTO reviews (reviewer, rating, `comment`, rdate) VALUES (?, ?, ?, ?)';
    // INSERT the new review into the database
    connection.query(sql, [reviewer, rating, comment, rdate], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding review:", error);
            res.status(500).send('Error adding review');
        } else {
            // Send a success response
            res.redirect('/'); // Redirect to reviews page or any desired location
        }
    });
});

// Edit Review
app.get('/editReview/:id', (req, res) => {
    const reviewId = req.params.id;
    const sql = 'SELECT * FROM reviews WHERE reviewId = ?';
    // Fetch data from MySQL based on the review ID
    connection.query(sql, [reviewId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving review by ID');
        }
        // Check if any review with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the review data
            res.render('editReview', { review: results[0] });
        } else {
            // If no review with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Review not found');
        }
    });
});

app.post('/editReview/:id', (req, res) => {
    const reviewId = req.params.id;
    // Extract review data from the request body
    const { reviewer, rating, comment, rdate } = req.body;
    const sql = 'UPDATE reviews SET reviewer = ?, rating = ?, comment = ?, rdate = ? WHERE reviewId = ?';

    // UPDATE the review in the database
    connection.query(sql, [reviewer, rating, comment, rdate, reviewId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating review:", error);
            res.status(500).send('Error updating review');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

// Delete Review
app.get('/deleteReview/:id', (req, res) => {
    const reviewId = req.params.id;
    const sql = 'DELETE FROM reviews WHERE reviewId = ?';
    connection.query(sql, [reviewId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting review:", error);
            res.status(500).send('Error deleting review');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});


// -----------------------------
app.get('/purchase', (req, res) => {
    res.render('purchase'); // Render the 'purchase.ejs' view file
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));