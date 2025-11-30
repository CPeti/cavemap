docker_build(
    'cave-service-image',
    './services/cave-service',
    live_update=[
        sync('./services/cave-service', '/app'),
    ]
)

docker_build(
    'frontend-image', 
    './frontend',
    dockerfile='./frontend/Dockerfile.dev',
    live_update=[
        sync('./frontend', '/app'),
    ]
)

k8s_yaml(
    helm(
        './charts',                               
        values=['./charts/values.yaml'],
        set=[
            'cave-service.image=cave-service-image',
            'frontend.image=frontend-image',
        ]
    )
)
