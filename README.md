# WeDo API

A backend API serving the WeDo application. Client code can be found [here](https://github.com/njyjn/wedo-client-react)

![Home page](/images/home_page.png)

- [WeDo API](#wedo-api)
  - [Authentication](#authentication)
  - [Endpoints](#endpoints)
    - [Invite](#invite)
      - [`GET` Invites](#get-invites)
      - [`GET` Invite](#get-invite)
      - [`POST` Invite](#post-invite)
      - [`DELETE` Invite](#delete-invite)
      - [`PATCH` Invite](#patch-invite)
      - [`PATCH` Invite Response](#patch-invite-response)
    - [Guest](#guest)
      - [`GET` Guests](#get-guests)
      - [`GET` Guest](#get-guest)
      - [`POST` Guest](#post-guest)
    - [Utilities](#utilities)
      - [`POST` Upload URL](#post-upload-url)
  - [Setup](#setup)

## Authentication

Auth0 is the authentication provider for this API. A JWT token generated from Auth0 must be presented in the header for all private endpoints as `Authorization: Bearer <token>`

In addition, an API token `x-api-token` must be present in the header. This does not serve any authentication purposes; rather, it is to help with rate limiting and throttling.

## Endpoints

This API has a number of endpoints hosted on AWS API Gateway

### Invite

The invite object is used to store information about the type of invitation (in-person guest or zoom), who the primary guest is, and whether any response has been submitted. Each invite has a unique 6-digit alphanumeric code and an associated QR code image.

#### `GET` Invites

`/invites`

Get all invites belonging to the logged in user

<details>
<summary>Response</summary>

```json
{
    "items": [
        {
            "qrCodeUrl": string,
            "inviteId": string,
            "userId": string,
            "responded": boolean,
            "createTs": time,
            "familyName": string,
            "attending": boolean,
            "type": string
        }
    ]
}
```
</details>

#### `GET` Invite

`/invites/:inviteId`

Get an individual invite by ID. Invite must belong to the logged in user

<details>
<summary>Response</summary>

```json
{
    "item": [
        {
            "qrCodeUrl": string,
            "inviteId": string,
            "userId": string,
            "responded": boolean,
            "createTs": time,
            "familyName": string,
            "attending": boolean,
            "type": string
        }
    ]
}
```
</details>

#### `POST` Invite

`/invites/:inviteId`

Create a new invite belonging to the user. Automatically creates a primary guest for the invite based on the provided Family Name as the guest Full Name

<details>
<summary>Body</summary>

```json
{
    "familyName": string,
    "type": string,
}
```
</details>

<details>
<summary>Response</summary>

```json
{
    "newItem": {
        "inviteId": string,
        "userId": string,
        "qrCodeUrl": string,
        "familyName": string,
        "type": string,
        "createTs": time,
        "responded": boolean,
        "attending": boolean
    },
    "primaryGuest": {
        "inviteId": string,
        "fullName": string,
        "guestId": string,
        "createTs": time
    }
}
```
</details>

#### `DELETE` Invite

`/invites/:inviteId`

Delete an invite by ID. Invite must belong to the logged in user

#### `PATCH` Invite

`/invites/:inviteId`

Update an invite by ID. Invite must belong to the logged in user

<details>
<summary>Request</summary>

```json
{
    "familyName": string,
    "type": string,
    "attending": boolean,
    "responded": boolean
}
```
</details>

<details>
<summary>Response</summary>

```json
{
    "familyName": string,
    "type": string,
    "attending": boolean,
    "responded": boolean
}
```
</details>


#### `PATCH` Invite Response

`/invites/:inviteId/respond`

Update an invite's attending and responded state by ID. A public endpoint for guests to respond without logging in

The `responded` attribute on the Invite is automatically marked `true`

<details>
<summary>Request</summary>

```json
{
    "familyName": string,
    "orgId": string,
    "attending": boolean
}
```
</details>

### Guest

The guest object is used to store information about the guest and their basic contact information. Invites can have multiple guests, but **as of the current iteration, they can only be created and viewed via the API.**

#### `GET` Guests

`/invites/:inviteId/guests`

Get all guests belonging to an invite of the logged in user

<details>
<summary>Response</summary>

```json
{
    "items": [
        {
            "createTs": time,
            "inviteId": string,
            "fullName": string,
            "contact": string,
            "guestId": uuid4
        }
    ]
}
```
</details>

#### `GET` Guest

`/invites/:inviteId/guest/:guestId`

Get an individual guest by ID of an invite. Invite must belong to the logged in user

<details>
<summary>Response</summary>

```json
{
    "item": {
        "createTs": time,
        "inviteId": string,
        "fullName": string,
        "contact": string,
        "guestId": uuid4
    }
}
```
</details>

#### `POST` Guest

`/invites/:inviteId/guests`

Create a new guest on an invite belonging to the user

<details>
<summary>Body</summary>

```json
{
    "fullName": string,
    "contact": string
}
```
</details>

<details>
<summary>Response</summary>

```json
{
    "newItem": {
        "inviteId": string,
        "fullName": string,
        "guestId": string,
        "contact": string,
        "createTs": time
    }
}
```
</details>

### Utilities

#### `POST` Upload URL

Retrieve a signed URL from AWS S3 to upload an Invite Attachment

<details>
<summary>Body</summary>

```json
{
    "fileName": string
}
```
</details>

<details>
<summary>Response</summary>

```json
{
    "uploadUrl": string
}
```
</details>

## Setup

Install
```shell
npm i
```

Configure an env file as `.env`/`.env.local` to store the needed env variables. A sample env file can be found in `.env.sample`

Deploy 
```shell
npm i -g serverless # install Serverless globally if not yet installed
sls deploy -v
```

If integrating with Travis, ensure the following flag is appended so that credentials will not be exposed

```shell
sls deploy -v --conceal-api-keys
```