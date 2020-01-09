export type nsIURI = {
    pathQueryRef: string
};

export type NumberOut = {
    value: number;
};

export type StringOut = {
    value: string;
};

export type Creations = {
    meetingCancellations: any[];
    meetingrequests: any[];
    meetingResponses: any[];
};

export type AttachmentsUpdates = {
    create: any[];
    delete: any[];
}

export type CalDateTime = {
    /**
     * isMutable is true if this instance is modifiable.
     * If isMutable is false, any attempts to modify
     * the object will throw NS_ERROR_OBJECT_IS_IMMUTABLE.
     */
    isMutable: boolean;

    /**
     * Make this calIDateTime instance immutable.
     */
    makeImmutable(): void;

    /**
     * Clone this calIDateTime instance into a new
     * mutable object.
     */
    clone(): CalDateTime;

    /**
     * valid is true if this object contains a valid
     * time/date.
     */
    // true if this thing is set/valid
    isValid: boolean;

    /**
     * nativeTime contains this instance's PRTime value relative
     * to the UTC epoch, regardless of the timezone that's set
     * on this instance.  If nativeTime is set, the given UTC PRTime
     * value is exploded into year/month/etc, forcing the timezone
     * setting to UTC.
     *
     * @warning: When the timezone is set to 'floating', this will return
     * the nativeTime as-if the timezone was UTC. Take this into account
     * when comparing values.
     *
     * @note on objects that are pinned to a timezone and have isDate set,
     * nativeTime will be 00:00:00 in the timezone of that date, not 00:00:00 in
     * UTC.
     */
    nativeTime: any;

    /**
     * Full 4-digit year value (e.g. "1989", "2004")
     */
    year: number;

    /**
     * Month, 0-11, 0 = January
     */
    month: number;

    /**
     * Day of month, 1-[28,29,30,31]
     */
    day: number;

    /**
     * Hour, 0-23
     */
    hour: number;

    /**
     * Minute, 0-59
     */
    minute: number;

    /**
     * Second, 0-59
     */
    second: number;

    /**
     * Gets or sets the timezone of this calIDateTime instance.
     * Setting the timezone does not change the actual date/time components;
     * to convert between timezones, use getInTimezone().
     *
     * @throws NS_ERROR_INVALID_ARG if null is passed in.
     */
    timezone: any;

    /**
     * Resets the datetime object.
     *
     * @param year     full 4-digit year value (e.g. "1989", "2004")
     * @param month    month, 0-11, 0 = January
     * @param day      day of month, 1-[28,29,31]
     * @param hour     hour, 0-23
     * @param minute   minute, 0-59
     * @param second   second, 0-59
     * @param timezone timezone
     *
     * The passed datetime will be normalized, e.g. a minute value of 60 will
     * increase the hour.
     *
     * @throws NS_ERROR_INVALID_ARG if no timezone is passed in.
     */
    resetTo(
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number,
        second: number,
        timezone: any
    ): void;

    /**
     * The offset of the timezone this datetime is in, relative to UTC, in
     * seconds. A positive number means that the timezone is ahead of UTC.
     */
    timezoneOffset: number;

    /**
     * isDate indicates that this calIDateTime instance represents a date
     * (a whole day), and not a specific time on that day.  If isDate is set,
     * accessing the hour/minute/second fields will return 0, and and setting
     * them is an illegal operation.
     */
    isDate: boolean;

    /*
     * computed values
     */

    /**
     * Day of the week. 0-6, with Sunday = 0.
     */
    weekday: number;

    /**
     * Day of the year, 1-[365,366].
     */
    yearday: number;

    /*
     * Methods
     */

    /**
     * Resets this instance to Jan 1, 1970 00:00:00 UTC.
     */
    reset(): void;

    /**
     * Return a string representation of this instance.
     */
    toString(): string;

    /**
     * Return a new calIDateTime instance that's the result of
     * converting this one into the given timezone.  Valid values
     * for aTimezone are the same as the timezone field.  If
     * the "floating" timezone is given, then this object
     * is just cloned, and the timezone is set to floating.
     */
    getInTimezone(aTimeZone: any): CalDateTime;

    // add the given calIDateTime, treating it as a duration, to
    // this item.
    // XXX will change
    addDuration (aDuration: any): void;

    // Subtract two dates and return a duration
    // returns duration of this - aOtherDate
    // if aOtherDate is > this the duration will be negative
    subtractDate(aOtherDate: CalDateTime): any;

    /**
     * Compare this calIDateTime instance to aOther.  Returns -1, 0, 1 to
     * indicate if this < aOther, this == aOther, or this > aOther,
     * respectively.
     *
     * This comparison is timezone-aware; the given values are converted
     * to a common timezone before comparing. If either this or aOther is
     * floating, both objects are treated as floating for the comparison.
     *
     * If either this or aOther has isDate set, then only the date portion is
     * compared.
     *
     * @exception calIErrors.INVALID_TIMEZONE  bad timezone on this object
     *                                         (not the argument object)
     */
    compare(aOther: CalDateTime): number;

    //
    // Some helper getters for calculating useful ranges
    //

    /**
     * Returns SUNDAY of the given datetime object's week.
     */
    startOfWeek: CalDateTime;

    /**
     * Returns SATURDAY of the datetime object's week.
     */
    endOfWeek: CalDateTime;

    // the start/end of the current object's month
    startOfMonth: CalDateTime;
    endOfMonth: CalDateTime;

    // the start/end of the current object's year
    startOfYear: CalDateTime;
    endOfYear: CalDateTime;

    /**
     * This object as either an iCalendar DATE or DATETIME string, as
     * appropriate and sets the timezone to either UTC or floating.
     */
    icalString: number;
};
