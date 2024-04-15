import os
import json

from enum import Enum

from typing import List, Optional

from keyboardsounds.root import ROOT

RULES_PATH = f"{ROOT}/rules.json"


class Action(Enum):
    EXCLUSIVE = "exclusive"
    DISABLE = "disable"
    ENABLE = "enable"


class GlobalAction(Enum):
    DISABLE = "disable"
    ENABLE = "enable"


class Rule:
    def __init__(self, app_path: str, action: Action) -> None:
        """
        Initializes a new Rule instance.

        :param app_path: Path of the app the rule applies to.
        :param action: Action (from Action enum) for the app.
        """
        self.app_path = app_path
        self.action = action


class Rules:
    def __init__(self, global_action: GlobalAction, rules: List[Rule]) -> None:
        """
        Initializes Rules instance managing app-specific rules and a global
        action.

        :param global_action: Default action for all apps.
        :param rules: List of Rule instances for specific apps.
        """
        self.global_action = global_action
        self.rules = rules

    def set_global_action(self, action: GlobalAction) -> None:
        """
        Sets the global action for the rules.

        :param action: The global action (from the GlobalAction enum) to be set.
        """
        self.global_action = action

    def set_rule(self, app_path: str, action: Action) -> None:
        """
        Sets or updates a rule for a specific application. If the rule exists,
        its action is updated. If not, a new rule is added.

        :param app_path: Application path for the rule to be set or updated.
        :param action: Action for the application.
        """
        # Check if the rule exists
        existing_rule = None
        for rule in self.rules:
            if rule.app_path == app_path:
                existing_rule = rule
                break

        # If the rule exists, update its action
        if existing_rule:
            existing_rule.action = action
        else:
            # Otherwise, add a new rule
            self.rules.append(Rule(app_path, action))

    def remove_rule(self, app_path: str) -> None:
        """
        Removes a rule for a specific application.

        :param app_path: Application path for the rule to be removed.
        """
        self.rules = [r for r in self.rules if r.app_path != app_path]

    def has_rule(self, app_path: str) -> bool:
        """
        Checks if a rule exists for a specific application.

        :param app_path: Application path to check for a rule.
        :return: True if a rule exists for the application, False otherwise.
        """
        return any(r.app_path == app_path for r in self.rules)

    def has_exclusive_rule(self) -> bool:
        """
        Checks if there is an exclusive rule in the rules.

        :return: True if an exclusive rule exists, False otherwise.
        """
        return any(r.action == Action.EXCLUSIVE for r in self.rules)

    def get_exclusive_rule(self) -> Optional[Rule]:
        """
        Retrieves the exclusive rule from the rules.

        :return: Rule with an exclusive action.
        """
        for r in self.rules:
            if r.action == Action.EXCLUSIVE:
                return r
        return None

    def get_action(self, app_path: str) -> Action:
        """
        Retrieves the action for a specific application.

        :param app_path: Application path to retrieve the action for.
        :return: Action applicable to the application.
        """
        if self.global_action == GlobalAction.DISABLE.value:
            for r in self.rules:
                if r.app_path == app_path:
                    if r.action == Action.ENABLE:
                        return Action.ENABLE
            return Action.DISABLE

        for r in self.rules:
            if r.app_path == app_path:
                return r.action
        return Action(self.global_action.value)

    def save(self) -> None:
        """
        Saves the current rules to the database.

        This function may raise exceptions related to file operations, such as
        IOError for I/O operation failures, PermissionError for insufficient
        permissions, and FileNotFoundError if the rules file is not found.

        Exceptions:
        - IOError: If an I/O operation fails.
        - PermissionError: If there are insufficient permissions.
        - FileNotFoundError: If the rules file does not exist.
        """
        with open(RULES_PATH, "w") as f:
            json.dump(
                {
                    "global_action": self.global_action.value,
                    "rules": [
                        {"app_path": r.app_path, "action": r.action.value}
                        for r in self.rules
                    ],
                },
                f,
            )


def get_rules() -> Rules:
    """
    Loads and returns the rules from the database.

    This function may raise exceptions related to file operations, such as:
    - IOError: If an I/O operation fails.
    - PermissionError: If there are insufficient permissions to read the file.
    - FileNotFoundError: If the rules file does not exist.

    :raises IOError: If an I/O operation fails.
    :raises PermissionError: If there are insufficient permissions.
    :raises FileNotFoundError: If the file path does not exist.
    """
    __safe_create_rules()

    with open(RULES_PATH, "r") as f:
        data = json.load(f)
        return Rules(
            global_action=GlobalAction(data["global_action"]),
            rules=[Rule(r["app_path"], Action(r["action"])) for r in data["rules"]],
        )


def __safe_create_rules() -> None:
    """
    Ensures the rules file exists, creating it with defaults if not.

    Used internally to avoid errors when file is absent.
    """
    if not os.path.exists(RULES_PATH):
        with open(RULES_PATH, "w") as f:
            json.dump(
                {
                    "global_action": GlobalAction.ENABLE.value,
                    "rules": [],
                },
                f,
            )
