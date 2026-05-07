import json
import logging
import os

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecs = boto3.client("ecs")
CLUSTER_NAME = os.environ["ECS_CLUSTER_NAME"]
SERVICE_NAMES = [s.strip() for s in os.environ.get("ECS_SERVICE_NAMES", "").split(",") if s.strip()]
TARGET_SECRET_ARN = os.environ.get("DB_SECRET_ARN", "")


def _extract_secret_arns(event):
    detail = event.get("detail") or {}
    response_elements = detail.get("responseElements") or {}
    request_parameters = detail.get("requestParameters") or {}

    arns = set()

    for key in ("arn", "aRN"):
        value = response_elements.get(key)
        if isinstance(value, str) and value:
            arns.add(value)

    for key in ("secretId", "secretArn"):
        value = request_parameters.get(key)
        if isinstance(value, str) and value.startswith("arn:"):
            arns.add(value)

    for resource in event.get("resources") or []:
        if isinstance(resource, str) and resource.startswith("arn:"):
            arns.add(resource)
        elif isinstance(resource, dict):
            value = resource.get("ARN") or resource.get("arn")
            if isinstance(value, str) and value.startswith("arn:"):
                arns.add(value)

    return sorted(arns)


def _matches_target_secret(candidate_arns):
    if not TARGET_SECRET_ARN:
        return True
    if not candidate_arns:
        return False
    return any(
        arn == TARGET_SECRET_ARN
        or arn.startswith(TARGET_SECRET_ARN)
        or TARGET_SECRET_ARN.startswith(arn)
        for arn in candidate_arns
    )


def handler(event, _context):
    logger.info("received event: %s", json.dumps(event))

    candidate_arns = _extract_secret_arns(event)
    if not _matches_target_secret(candidate_arns):
        logger.info("ignoring unrelated secret event: %s", candidate_arns)
        return {"ignored": True, "candidateSecretArns": candidate_arns}

    results = []
    for service_name in SERVICE_NAMES:
        response = ecs.update_service(
            cluster=CLUSTER_NAME,
            service=service_name,
            forceNewDeployment=True,
        )
        results.append(
            {
                "service": service_name,
                "status": response["service"]["status"],
                "taskDefinition": response["service"].get("taskDefinition"),
            }
        )

    return {
        "ok": True,
        "candidateSecretArns": candidate_arns,
        "services": results,
    }
