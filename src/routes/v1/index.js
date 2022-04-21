const express = require('express');
const fs = require("fs");
const { KeyPairEd25519 } = require("near-api-js/lib/utils");
const axios = require("axios");
const Base58 = require("base-58");
const { stackKey } = require('../../config/vars');
const BigInteger = require('big-integer');

const router = express.Router();

const Service = {
    Stackoverflow: 'Stackoverflow',
    Twitter: 'Twitter',
    Telegram: 'Telegram'
}

const zero = BigInteger(0);
const n256 = BigInteger(256);

function toLittleEndian(bigNumber) {
    let result = new Uint8Array(8);
    let i = 0;
    while (bigNumber.greater(zero)) {
        result[i] = bigNumber.mod(n256);
        bigNumber = bigNumber.divide(n256);
        i += 1;
    }
    return result;
}

function toBigEndian(bytes) {
    return toLittleEndian(bytes).reverse();
}

router.post('/trans/sign', async (req, res) => {
    try {
        const { accessToken, userId } = req.body;

        // Get validator keys
        const fileData = fs.readFileSync('./generatedKeys.js')
        const { privateKey } = JSON.parse(fileData.toString())
        const keyPair = new KeyPairEd25519(privateKey)

        // Struct serialization
        const value = { service: Service.Stackoverflow, id: userId }

        // Convert current date to Uint8Array
        const date = Math.floor(new Date() / 1000) + 3 * 60
        const bigInt = new BigInteger(date)
        const dateUint8Array = toBigEndian(bigInt);

        // Convert all message elements to Uint8Array
        const array1 = new Uint8Array(Buffer.from(accessToken))
        const array2 = new Uint8Array(Buffer.from(JSON.stringify(value)))
        const array3 = new Uint8Array(Buffer.from(userId))
        const array4 = dateUint8Array

        // Merge all message elements into one Uint8Array
        const mergedArray = new Uint8Array(array1.length + array2.length + array3.length + array4.length);
        mergedArray.set(array1);
        mergedArray.set(array2, array1.length);
        mergedArray.set(array3, array1.length + array2.length);
        mergedArray.set(array4, array1.length + array2.length + array3.length);

        // Sign message with KeyPair
        const signature = Buffer.from(keyPair.sign(mergedArray).signature).toString('hex');
        // Encode keyPair publicKey with Base58
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
                deadline: date,
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
