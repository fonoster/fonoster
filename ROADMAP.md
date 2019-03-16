# Roadmap
The following is only a selection of some of the major features we plan to implement in the near future.
To get a more complete overview of planned features and current work, see the issue trackers for the various repositories, for example, the [YAPS ecosystem](https://github.com/fonoster/yaps).

Here is the roadmap by component:

## Media Controller(MC)

The media controller receives AGI request from Asterisk and takes control of the call flow. It also allows the implementor to access external resources like databases, RESTful APIS.

AGI requests are received by routing logic call the `dispatcher`. The dispatcher uses the information
in the AGI request to rout the call to the appropriate handler.

Component Specs:

- The handler functions are mounted in the MC filesystem
- The MC must have access to the `admin` API(like logging, storage, billing, etc.)
- A simplified request is sent to the handler from the dispatcher
- A simplified API is provide for flow control, consisting in several verbs(Play, Say, Stash, Record...)
- The MC receives AGI request from one ore more Media Servers
- The MC sends logging, billing, and other events to a Message Queue(MQ).
- Must have the ability to discover the File Server and mount the required folder
- Must be able to run user code(jailed)

Note: The MC component will not provide with a deploy/undeploy logic

TODO:

[] Draft `admin` functions to include function `admin.functions.getHandler(request)`
[] FileServer discovery logic.
[] Simplified Voice APIS

## Media Server(MS)
## Message Queue(MQ)
## Files Server(FS)
