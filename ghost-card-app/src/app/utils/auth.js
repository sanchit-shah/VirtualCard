function validateCredentials(username, password) {
    const testUsername = "testUser";
    const testPassword = "testPass";

    return username === testUsername && password === testPassword;
}

export { validateCredentials };