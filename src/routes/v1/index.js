const express = require('express');
const fs = require("fs");
const { KeyPairEd25519 } = require("near-api-js/lib/utils");
const axios = require("axios");
const Base58 = require("base-58");
const borsh = require("borsh");
const { stackKey } = require('../../config/vars');
const crypto = require('crypto');

const router = express.Router();

const fromHexToU8Array = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

const Service = {
    Stackoverflow: 'Stackoverflow',
    Twitter: 1,
    Telegram: 2
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
        console.log({ accountId, userId })
        // const userId = '17694405'

        // Get validator keys
        const fileData = fs.readFileSync('./generatedKeys.js')
        const { privateKey } = JSON.parse(fileData.toString())
        const keyPair = new KeyPairEd25519(privateKey)

        const deadline = (new Date().getTime() + 1200 * 60000) * Math.pow(10, 6)
        // const deadline = 1651531536353000000

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

        const des = borsh.deserialize(schema, ValidatorMsg, buffer)

        const des2 = borsh.deserialize(schema, ValidatorMsg, Buffer.from([
            0,   8,   0,   0,   0,  49, 55,  54,  57,  52,
            52,  48,  53,  19,   0,   0,  0, 118, 101, 114,
            107, 104, 111, 104, 108, 105, 97, 100,  46, 116,
            101, 115, 116, 110, 101, 116, 64, 250, 172, 159,
            46, 107, 235,  22
        ]))

        console.log({ buffer, u8, des, des2 })
        console.log({ value })

        // Hashing serialized data
        const sha512 = crypto.createHash('sha512');
        const hash = sha512.update(buffer);
        const hex = hash.digest('hex');

        // Format from hex to U8Array
        const message = fromHexToU8Array(hex)

        console.log({ message, hex })

        // Sign with the validator key
        // const sign = keyPair.sign(message).signature;

        // const signature = toHexString(keyPair.sign(message).signature)
        const signatureT = toHexString(keyPair.sign(u8).signature)
        // const signature = keyPair.sign(u8).signature
        const signature = keyPair.sign(u8).signature;
        const signatureHex = Buffer.from(signature).toString('hex');
        // const sig = Buffer.from(keyPair.sign(message).signature).toString('hex');
        // Encode keyPair publicKey with Base58
        const validatorId = Base58.encode(keyPair.getPublicKey().data)

        console.log({ signatureT, signature, signatureHex, validatorId })

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
                signature: signature,
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
        console.log('error', error);
        res.status(400).json({
            success: false,
            message: error
        });
    }
});

module.exports = router;
