import { Request, onRequest } from 'firebase-functions/v2/https'
import * as express from 'express'
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const newOrder = onRequest(async (request: Request, response: express.Response) => {
    try {
      const item = await db
        .doc(`external-keys/${request.body.access_token}`)
        .get()

      const itemData = item.data() || {}
      if (itemData['uid'] != request.body.author) {
        response.json({ error: 'Доступ запрещен' })
      } else {
        const fieldsList = [
          'author',
          'type',
          'orderDate',
          'address',
          'geometry',
          'price'
        ]
        const fields = [...fieldsList, 'description', 'payType', 'photo']

        const res = await db.collection('orders').add({
          ...dictonaryOfBody(fieldsList, request.body),
          confirm: false
        })
        await db
          .doc(`orders/${res.id}`)
          .set(dictonaryOfBody(fields, request.body))

        response.json({ result: 'ok' })
      }
    } catch (error) {
      response.json({ error: 'Доступ запрещен' })
    }
  }
)

function dictonaryOfBody (fieldsList: string[], body: { [key: string]: any }) {
  return fieldsList.reduce((acc: { [key: string]: any }, fieldName: string) => {
    acc[fieldName] = body[fieldName]
    return acc
  }, {})
}
