# The Unified Listing API

The Unified Listing is a resource for people who want to find assistive technology solutions and mainstream products with
assistive features.  The live instance can be found at:

[http://ul.gpii.net](http://ul.gpii.net)

This package provides a working copy of the Unified Listing API, including the [API documentation](./src/js/api/docs/apidocs.md),
and sample data that can be used to test integrations with the UL API.

For the reference front-end user interface that runs on top of the API, see the [ul-website](https://github.com/GPII/ul-website/)
package.

## Running the API Locally.

To use this package, you must have a supported version of [`node.js`](https://nodejs.org/) installed.  Currently, the
package is developed with and tested against the 6.9.1 LTS version of node.  Once you have `node` installed:

1. Install the required libraries by running `npm install`.
2. Launch the API test harness using the command `node tests/js/launch-test-harness.js`.
3. An instance of the API with test data will be available at:  [http://localhost:6714/api/](http://localhost:6714/api/)
4. See [the API docs](./src/js/api/docs/apidocs.md) for details on the available API endpoints and options for each.

## Creating a Test User

The search and other "read" endpoints in the UL API do not require a login.  However, to add data to the UL, you will
need to login using an account with the correct permissions.  To create an account, you can either clone and edit one of
the existing users, or create an account using the self-signup procedure.

### Cloning an Existing User

The existing user data used by the test harness can be found at `./tests/data/users.json`.  The hashed passwords are all
set to `password`.  As long as you are only editing the username and email address, your cloned users should have the
same password.

### Creating a New User

The UL API includes a copy of the [gpii-express-user/](https://github.com/GPII/gpii-express-user/) user management
package.  See that package for full details about the supported login/logout endpoints.

To create a user using the self-signup procedure:

1. Launch the test harness as outlined above.
2. Open the signup endpoint in your browser: [http://localhost:6714/api/user/signup](http://localhost:6714/api/user/signup)
3. Fill out and submit the form.

You will need to verify the new account before you can use it to log in.  The verification process normally depends on a
mail server.  When using the test harness, you must manually verify the new account:

1. Open the administrative interface for the test database: [http://localhost:6715/_utils/](http://localhost:6715/_utils/)
2. Navigate to the `users` database (note, we do not use the similarly named `_users` database).
3. Look for the record whose `id` corresponds to the new username, as in `org.couchdb.user:myuser`
4. Edit the record and change `verified` to `true`.
5. Save your changes.
6. You should now be able to log in with the new account.

### Permissions and Test Accounts

By default, each user has permission to read data from all unified records and public sources.  Users also have
permission to write to their private datasource, which consists of a tilde and their username (as in `~myuser`).

There are also a handful of sources maintained by database contributors, write access to these is controlled by the
permissions in `./src/js/sources/sources.json`.  For test purposes, an account with permission to write to each of these
sources is provided as part of the test data in this package.  The sources associated with data coming from EASTIN are
writable using the `eastin` test user, password `password`.  The source associated with data coming from the
[Semantic Alignment Tool](http://sat.gpii.net/) is writable using the `sat` test user, password `password`.

## Running the Tests in this Package

To run the tests in this package, use the command `npm test`.
