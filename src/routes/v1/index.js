const express = require('express');
const fs = require("fs");
const { KeyPairEd25519 } = require("near-api-js/lib/utils");
const axios = require("axios");
const Base58 = require("base-58");
const borsh = require("borsh");
const { stackKey } = require('../../config/vars');

const router = express.Router();

const Service = {
    Stackoverflow: 'Stackoverflow',
    Twitter: 'Twitter',
    Reddit: 'Reddit',
}

class ValidatorMsg {
    constructor({ service_id, account_id, deadline }) {
        this.service_id = service_id
        this.account_id = account_id
        this.deadline = deadline
    }
}

class ServiceId {
    constructor({ service, id }) {
        this.service = service
        this.id = id
    }
}

router.post('/trans/sign', async (req, res) => {
    try {
        const { accessToken, userId, accountId } = req.body;

        // Get validator keys
        const fileData = fs.readFileSync('./generatedKeys.js')
        const { privateKey } = JSON.parse(fileData.toString())
        const keyPair = new KeyPairEd25519(privateKey)

        // Make deadline as +3 mins of current time in nano secs
        const deadline = (new Date().getTime() + 3 * 60 * 1000) * Math.pow(10, 6)

        // Value for serialization
        const value = new ValidatorMsg({
            service_id: new ServiceId({ service: Service.Stackoverflow, id: userId }),
            account_id: accountId,
            deadline: String(deadline),
        })

        // Schema for serialization
        const schema = new Map([
            [ValidatorMsg, {
                kind: 'struct',
                fields: [
                    ['service_id', ServiceId], ['account_id', 'string'], ['deadline', 'u64']
                ]
            }],
            [ServiceId, {
                kind: 'struct',
                fields: [
                    ['service', 'u8'], ['id', 'string']
                ]
            }]
        ]);
        const buffer = borsh.serialize(schema, value);
        const u8 = new Uint8Array(buffer)

        // Sign with the validator key
        const signature = keyPair.sign(u8).signature;
        const validatorId = Base58.encode(keyPair.getPublicKey().data)

        console.log({ u8, accountId, userId, deadline, signature, validatorId })

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
                deadline: String(deadline),
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
    } catch (error) {
        if (error.response) {
            console.log('error', error.response.data);
            res.status(error.response.status).json({
                success: false,
                message: error.response.data,
            });
        } else {
            console.log('error', error);
            res.status(400).json({
                success: false,
                message: error,
            });
        }

    }
});

module.exports = router;
