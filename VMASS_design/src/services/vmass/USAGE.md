# VMASS React Native Data Layer

## Use endpoint by key

```javascript
import { callVmassEndpoint } from "./api";

const result = await callVmassEndpoint("AUTH_POST_SIGNIN", {
  body: { username, password, domain },
});
```

## Use proxy API

```javascript
import { vmassApi } from "./api";

const result = await vmassApi.AUTH_POST_SIGNIN({
  body: { username, password, domain },
});
```
