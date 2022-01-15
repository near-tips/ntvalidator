const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.json('OK!');
    } catch (error) {
        console.log('error', error);
        res.status(400).json({
            success: false,
            message: error
        });
    }
});

module.exports = router;
