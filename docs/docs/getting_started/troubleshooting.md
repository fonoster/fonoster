# Troubleshooting

## Are you not receiving the call at all?

1. Check is that your SIP Service Provider configuration is correct. 
2. Double-check the `username`, `password`, and `host`. 
3. If your Provider has an Admin console, check if you can see the registration coming from Fonoster.
4. Make sure the `from` matches the Number given to you by your Provider and ensure the `to` has the correct prefix (for example, +1).

## You receive the call but immediately hang up (did not hear a sound)

1. Verify that Ngrok is still running. 
2. Compare Ngrok's URL with the `webhook` on your Number. Remember they must match.

Then observe the console's output where your Programmable Voice Application is running, and look for any errors.

## More help? 

- Join our [Discord](https://discord.gg/4QWgSz4hTC)
- Reach us on Twitter: [@fonoster](https://twitter.com/fonoster)

**Github discussions:**

- [Q&A](https://github.com/fonoster/fonoster/discussions/categories/q-a) – for discussions around Fonoster usage and community support


