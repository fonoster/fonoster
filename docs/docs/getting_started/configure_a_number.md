# Configure a number

Fonoster is a *bring your prefered tools* Open Source alternative to programmable communication alternatives on the market. This means that you can use any service that makes sense for your applications, including your favorite Voice Over Internet Protocol (VoIP) provider.

## Choosing a VoIP provider

With Fonoster you can bring your own VoIP Provider for call origination or termination. However, we recommend using [VoIP.ms](https://voip.ms/) for US and Canada.

Once you have a VoIP provider, you will need to compile the following information:

- Trunk Host/IP
- SIP Username for registration
- SIP Password for registration
- Transport (usually `UDP` or `TCP`)
- Phone number ideally in E.164 format

## Adding a new VoIP provider

Using the CLI or the [Console](https://console.fonoster.com) create a new Trunk with the information form your VoIP provider. 

If using the CLI, run the following command:

```none
fonoster providers:create
```

## Adding a new number

Adding a new Number is just as easy. Simply type the following command on your terminal:

```bash
fonoster numbers:create
```

> Skip the "address of record" option

You are all set.
