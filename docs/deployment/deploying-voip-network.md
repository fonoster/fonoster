
# Configure the Voip network

To configure your Voip network, by first creating a `Provider`. To create provider simply run the `fonos providers:create`
command and follow the prompt. Refer to your Service Provider to obtain your `username`, `password`, and `host`. 

You next need add a `Number` to your deployment. The command for this is `fonos numbers:create`. You will be prompted to enter the number using the E164 format. After pressing enter, you need to select the service provider you created in the last step. Ignore the `aorlink`. And select the Ingress Application from the list.

Finally you must create a `Domain` and `Agent`. Using `fonos domains:create` and `fonos agent:create` respectively.
