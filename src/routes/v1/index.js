const express = require('express');
const fs = require("fs");
const { KeyPairEd25519 } = require("near-api-js/lib/utils");
const axios = require("axios");
const Base58 = require("base-58");
const { stackKey } = require('../../config/vars');

const router = express.Router();

router.post('/trans/sign', async (req, res) => {
    try {
        const { accessToken, userId } = req.body;

        // Get validator keys
        const fileData = fs.readFileSync('./generatedKeys.js')
        const { privateKey } = JSON.parse(fileData.toString())
        const keyPair = new KeyPairEd25519(privateKey)

        // Create and encrypt message
        const msg = userId + accessToken;
        const unit8Message = new Uint8Array(Buffer.from(msg))
        const signature = Buffer.from(keyPair.sign(unit8Message).signature).toString('hex');
        // Encode validator public key
        const validatorId = Base58.encode(keyPair.getPublicKey().data)

        // Get user data
        const { data } = await axios.get('https://api.stackexchange.com/2.3/me', {
            params: {
                access_token: accessToken,
                site: 'stackoverflow',
                key: stackKey,
            }
        })

        // Validate that user id same that we get by that access_token
        if (data.items[0].user_id.toString() === userId) {
            res.json({
                signature,
                validatorId,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Can not validate'
            });
        }
    } catch (error) {
        console.log('error', error);
        res.status(400).json({
            success: false,
            message: error
        });
    }
});

module.exports = router;
