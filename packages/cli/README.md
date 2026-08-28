# @mapseekai/cartography.md

CLI and TypeScript API for the [cartography.md](https://github.com/mapseekai/cartography.md) cartographic design contract.

```bash
pnpm dlx --package=@mapseekai/cartography.md cartographymd lint \
  CARTOGRAPHY.md --profile DATA_PROFILE.json --style style.json
```

```ts
import {lintFile} from '@mapseekai/cartography.md';

const report = await lintFile('CARTOGRAPHY.md', {
  dataProfilePath: 'DATA_PROFILE.json',
  stylePath: 'style.json',
});
```

The package validates document structure, token references, data semantics, the official MapLibre Style Specification, and the cartography.md-to-style contract. See the repository for the full specification and examples.
