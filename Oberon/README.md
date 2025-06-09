# Oberon-Internal file distribution guide

```
Oberon
│   README.md
│
└───Interface
│   │   file011.txt
│   │   file012.txt
│   │
│   └───frontend
│   │   │   file111.txt
│   │   │   file112.txt
│   │   │   ...
│   │
│   └───backend
│       │   file111.txt
│       │   file112.txt
│       │   ...
│   
└───etc
    │   file021.txt
    │   file022.txt
```

Use uvicorn main:app --reload in backend dir
use npm run dev on frontend dir

